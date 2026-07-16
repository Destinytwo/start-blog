---
title: "Robocon 仿生四足机器人视觉模块：OpenCV 赛道识别、路径中线和现场调参"
published: 2024-07-09
updated: 2024-07-09
draft: false
description: "整理 Robocon 仿生四足机器人项目中的视觉模块：相机输入、ROI 裁剪、阈值分割、轮廓筛选、中线拟合、偏差输出和现场调参。"
tags: ["Robocon", "四足机器人", "OpenCV", "Jetson Nano", "ROS", "视觉模块", "赛道识别"]
category: "机器人竞赛项目"
author: "Funny"
---

## 写在前面

本文整理 Robocon 仿生四足机器人项目中的视觉模块。项目整体涉及机械结构、运动控制、步态、通信和现场策略，本文聚焦 **视觉方向**：如何从相机画面中稳定提取赛道 / 引导线信息，并把结果转成后续控制模块可以使用的偏移量、方向角和置信度。

文中的代码片段保留核心图像处理链路，重点用于说明相机输入、分割、拟合、输出和现场调试方式。

## 一、项目目标：让四足机器人知道“路在哪里”

四足机器人竞速场景里，视觉模块的目标不是做复杂的语义理解，而是把相机画面快速变成三个关键量：

| 输出量 | 含义 | 给后续模块的价值 |
| --- | --- | --- |
| `center_offset` | 路径中线相对图像中心的横向偏移 | 判断机器人是否偏左 / 偏右 |
| `heading_error` | 路径方向相对前进方向的角度偏差 | 判断下一步需要修正的方向 |
| `confidence` | 当前识别结果可信度 | 低置信度时减速、保持或切换备选策略 |

视觉侧更关注两件事：

1. **识别要稳**：光照变化、地面反光、背景干扰不能让结果大幅跳动。
2. **输出要轻**：四足平台本身控制频率高，视觉模块不能拖慢整体响应。

所以整体方案没有一上来做重模型，而是优先用 OpenCV 传统图像处理完成低延迟路径识别。

## 二、硬件和软件链路

资料里包含 BeeDog 四足平台、ROS 源码包以及 Astra 相机相关驱动。ROS 包中有 `ros_astra_camera`，可提供 RGB / 深度图像、相机参数和点云话题；其中 RGB 启动文件里给出的输入配置是 640 x 480、30 fps。这可以作为视觉输入链路的一种支撑。

视觉链路可以概括为：

```text
相机采集
  -> OpenCV / ROS 图像输入
  -> ROI 裁剪
  -> 灰度或 HSV 颜色空间转换
  -> 阈值分割
  -> 形态学去噪
  -> 轮廓筛选
  -> 路径中线拟合
  -> 输出 offset / heading / confidence
```

![Robocon 四足机器人视觉识别流程](/blog-assets/robocon-vision-pipeline.svg)

> 四足机器人视觉识别流程：相机输入先经过 ROI 裁剪和阈值分割，最后输出路径中线、横向偏移、方向角和置信度；调试时要同时观察原图 ROI、二值 mask、拟合线和输出曲线。

如果走 ROS 图像流，常用检查命令类似这样：

```bash
# 启动 Astra RGB 相机节点
roslaunch astra_camera astra_rgb.launch

# 查看图像话题
rostopic list | grep image

# 查看帧率
rostopic hz /camera/image_raw

# 用 image_view 快速验证画面
rosrun image_view image_view image:=/camera/image_raw
```

如果在 Jetson Nano 上直接用 USB 摄像头，也可以先用 OpenCV 做最小链路验证：

```python
import cv2

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_FPS, 30)

while True:
    ok, frame = cap.read()
    if not ok:
        break
    cv2.imshow("camera", frame)
    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()
```

这一步只验证输入是否稳定，不急着做识别。相机画面如果本身掉帧、曝光乱跳或视角不合适，后面算法调得再复杂也会不稳定。

## 三、ROI：不要让算法看整张图

四足竞速场景中，真正对路径判断有价值的区域通常在画面下半部分。画面上半部分经常包含远处背景、人员、场馆灯光和无关物体，直接全图处理会引入干扰，也会浪费算力。

所以先裁剪 ROI：

```python
def crop_roi(frame):
    height, width = frame.shape[:2]
    y1 = int(height * 0.55)
    y2 = int(height * 0.95)
    x1 = int(width * 0.08)
    x2 = int(width * 0.92)
    roi = frame[y1:y2, x1:x2]
    return roi, (x1, y1)
```

这里的比例不是固定真理，需要根据相机安装角度调整。常见调整方式是：

- 相机俯角越大，ROI 可以越靠下。
- 机器人速度越快，ROI 需要保留更远一点的前方区域。
- 如果地面反光明显，宁愿缩小 ROI，也不要让强反光区域参与阈值分割。

ROI 是传统视觉里最容易被低估的一步。它不改变算法本质，但能显著降低误检和抖动。

## 四、阈值分割：灰度和 HSV 都要准备

现场识别一般会遇到两种情况：

1. 目标线和地面亮度差明显，灰度阈值足够。
2. 目标线有明显颜色特征，HSV 更稳定。

两套方案都需要准备，赛前根据现场光照选择。

### 1. 灰度阈值版本

```python
import cv2

def segment_by_gray(roi):
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    _, binary = cv2.threshold(
        blur,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU,
    )

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)
    return binary
```

灰度版本的优点是快，缺点是受光照影响明显。如果赛场灯光有局部阴影，Otsu 自动阈值可能会把阴影边缘也分出来。

### 2. HSV 颜色阈值版本

```python
import cv2
import numpy as np

def segment_by_hsv(roi, lower=(0, 0, 160), upper=(180, 80, 255)):
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    mask = cv2.inRange(hsv, np.array(lower), np.array(upper))

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    return mask
```

HSV 版本更适合目标线颜色固定的情况。实际调参时把 `lower` 和 `upper` 写到配置里，现场根据灯光快速切换。

## 五、轮廓筛选：不要只找最大轮廓

很多入门写法会直接找最大轮廓，但比赛现场不一定可靠。比如地面反光、边框、贴纸、背景物体都可能形成大块区域。更稳的做法是给轮廓加几层约束：

- 面积不能太小，否则大概率是噪声。
- 外接矩形比例要合理，过滤掉不符合路径形态的区域。
- 轮廓重心不能离 ROI 过远。
- 多个候选区域可以按面积、位置和连续性综合打分。

```python
import cv2

def select_path_contour(binary):
    contours, _ = cv2.findContours(
        binary,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE,
    )

    candidates = []
    height, width = binary.shape[:2]

    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 300:
            continue

        x, y, w, h = cv2.boundingRect(contour)
        aspect = w / max(h, 1)
        if aspect > 8 or h < 12:
            continue

        moments = cv2.moments(contour)
        if moments["m00"] == 0:
            continue

        cx = int(moments["m10"] / moments["m00"])
        center_penalty = abs(cx - width / 2) / width
        score = area * (1 - center_penalty)
        candidates.append((score, contour))

    if not candidates:
        return None

    candidates.sort(key=lambda item: item[0], reverse=True)
    return candidates[0][1]
```

这段逻辑的重点不是参数本身，而是“不要只相信单一条件”。现场环境不稳定时，多条件筛选比最大轮廓更抗干扰。

## 六、中线拟合：把像素结果变成控制可用的数字

找到候选路径区域后，需要把它转成中线、偏移量和方向角。这里可以用轮廓点拟合直线，也可以按行扫描提取中心点。工程上更稳定的方式是：先从二值图里按行取中心点，再做直线拟合。

```python
import cv2
import numpy as np

def fit_centerline(binary):
    height, width = binary.shape[:2]
    points = []

    for y in range(height - 1, 0, -12):
        xs = np.where(binary[y] > 0)[0]
        if len(xs) < 8:
            continue
        cx = int((xs.min() + xs.max()) / 2)
        points.append([cx, y])

    if len(points) < 3:
        return None

    points = np.array(points, dtype=np.float32)
    vx, vy, x0, y0 = cv2.fitLine(points, cv2.DIST_L2, 0, 0.01, 0.01)

    bottom_y = height - 1
    bottom_x = int(x0 + (bottom_y - y0) * vx / max(vy, 1e-6))
    top_y = int(height * 0.25)
    top_x = int(x0 + (top_y - y0) * vx / max(vy, 1e-6))

    center_offset = (bottom_x - width / 2) / (width / 2)
    heading_error = np.degrees(np.arctan2(float(vx), float(vy)))

    return {
        "bottom": (bottom_x, bottom_y),
        "top": (top_x, top_y),
        "center_offset": float(center_offset),
        "heading_error": float(heading_error),
        "confidence": min(len(points) / 12, 1.0),
    }
```

这里有三个细节：

1. `center_offset` 做了归一化，后续模块不需要关心图像分辨率。
2. `heading_error` 用角度表示，便于调试时直接读数。
3. `confidence` 不追求复杂，只要能反映当前检测点是否足够多。

## 七、可视化调试：现场一定要看得见中间结果

视觉调试最怕只输出最终数字。现场出现问题时，如果看不到 ROI、mask、轮廓和拟合线，很难判断是相机、阈值、ROI 还是算法逻辑出错。

需要保留一个调试绘制函数：

```python
def draw_debug(roi, binary, line_result):
    debug = roi.copy()

    if line_result:
        cv2.line(
            debug,
            line_result["bottom"],
            line_result["top"],
            (0, 0, 255),
            3,
        )
        text = (
            f"offset={line_result['center_offset']:.2f} "
            f"heading={line_result['heading_error']:.1f} "
            f"conf={line_result['confidence']:.2f}"
        )
        cv2.putText(
            debug,
            text,
            (12, 28),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2,
        )

    binary_bgr = cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)
    return cv2.hconcat([debug, binary_bgr])
```

赛前联调时重点看：

- ROI 是否截到了真正有用的赛道区域。
- mask 是否把目标线完整分出来。
- 中线是否跟随目标线，而不是跟随反光或边缘。
- 偏移量是否连续变化，不能一帧左、一帧右。

## 八、输出接口：视觉只交付干净结果

视觉模块不应该直接替控制模块做复杂决策。更合适的是只输出结构化结果，让控制侧根据策略使用：

```python
from dataclasses import dataclass

@dataclass
class VisionResult:
    center_offset: float
    heading_error: float
    confidence: float
    lost: bool

def build_result(line_result):
    if line_result is None:
        return VisionResult(
            center_offset=0.0,
            heading_error=0.0,
            confidence=0.0,
            lost=True,
        )

    return VisionResult(
        center_offset=line_result["center_offset"],
        heading_error=line_result["heading_error"],
        confidence=line_result["confidence"],
        lost=line_result["confidence"] < 0.25,
    )
```

如果接 ROS，可以把它发布成自定义消息，也可以先用简单 JSON / 串口协议联调。重点是说明视觉模块输出了什么、为什么这样输出。

## 九、现场调参经验

这类项目最容易出问题的地方不是代码能不能跑，而是现场环境和实验环境不一致。比较实用的调参要点包括：

### 1. 相机位置比算法更重要

相机固定不牢、俯角变化、线缆拉扯都会让画面变化。算法参数调得再好，如果相机角度每次都变，结果也很难复现。

### 2. 阈值要准备两套

上午、下午、场馆灯光、地面反光都会影响阈值。灰度阈值和 HSV 阈值各准备一套，现场切换会比临时改代码靠谱。

### 3. 输出要做平滑

单帧识别可能跳动，直接喂给后续模块会导致动作不稳定。视觉侧可以做简单滑动平均：

```python
from collections import deque

class SmoothValue:
    def __init__(self, size=5):
        self.values = deque(maxlen=size)

    def update(self, value):
        self.values.append(float(value))
        return sum(self.values) / len(self.values)
```

### 4. 低置信度要明确标记

识别不到时不要硬输出一个看似正常的偏移量。`lost=True` 比错误自信更安全，后续模块可以选择减速、保持上一帧或进入人工接管。

### 5. 现场要留截图和日志

每次调参后记录参数、截图和异常现象，能减少重复试错。尤其是 ROI、阈值和相机曝光这几项，最好形成一张简单清单。

## 十、工程要点

Robocon 四足机器人视觉模块的核心要点主要有三点：

1. **传统视觉仍然很有价值**：在规则明确、实时性要求高、算力有限的竞赛场景里，OpenCV 方案足够直接、高效、可控。
2. **工程链路比单个算法更重要**：相机输入、ROI、阈值、滤波、输出接口、调试界面都要串起来，模块才真正可用。
3. **现场调试要留余量**：参数配置、备选阈值、低置信度策略和日志记录，都是比赛现场稳定性的来源。

一句话总结：视觉模块负责让机器人在视觉层面尽可能稳定地知道前方路径在哪里，并把这个信息以低延迟、可解释的方式交给后续模块。
