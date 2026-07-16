---
title: "车载终端自动化测试脚本与回归清单：把高频场景做成可复用流程"
published: 2025-10-15
updated: 2025-10-15
draft: false
description: "整理车载终端测试开发实习中的自动化回归思路：休眠监听、CAN 唤醒、网络恢复、SSH 验证和结果记录。"
image: "/blog-assets/car-terminal-test-cover.svg"
tags: ["自动化测试", "回归清单", "TBOX", "CANFD", "ECALL"]
category: "车载测试项目"
author: "Funny"
---

## 写在前面

本文整理车载终端测试开发实习中的自动化回归思路，重点是把“休眠 - 唤醒 - 网络恢复 - 外网验证”这条链路讲清楚。

这是车载终端测试开发里的一个细分场景。这里讨论的是测试开发脚本：前置条件怎么查、日志怎么采、结果怎么判，以及失败时怎么留下可追溯证据。

## 一、哪些场景最适合脚本化

高频场景可以先分成四类：

1. 环境检查
2. 状态触发
3. 日志采集
4. 结果校验

对应到车载终端测试里，最值得脚本化的场景通常是这些：

- 休眠唤醒后定位是否正常。
- 上电后首帧和首个定位是否按时出来。
- 长时间运行后是否出现漂移、丢包或状态滞后。
- 平台上报是否按周期发送。
- SOS、ECALL、DOIP 和网络切换后状态是否闭环。
- 失败后是否能补发、重试或恢复到初始状态。

## 二、脚本拆法

如果把脚本拆开，通常可以分成四层：

### 1. 环境准备脚本

先确认系统、模块和网络状态，再开始跑场景。

### 2. 场景触发脚本

负责下发唤醒、重启、切换网络、触发诊断或平台交互。

### 3. 日志采集脚本

把终端日志、CAN 报文和网络状态同步记录下来。

### 4. 结果判断脚本

把“是否成功”变成明确的判定条件，而不是只靠肉眼看界面。

![车载终端自动化回归闭环](/blog-assets/car-terminal-automation-loop.svg)

> 自动化回归闭环：脚本每一轮都围绕 `stage` 记录失败点，把休眠监听、CAN 唤醒、网络恢复、SSH 验证和 JSONL 结果串成可统计的测试证据。

```bash
# 常用的排障命令
journalctl -f
dmesg -w
lsmod
ip addr
ip route
candump can0
candump can1
nmcli dev status
nmcli dev wifi list
ping 8.8.8.8
```

这些命令本身不复杂，但它们适合被脚本串起来，形成固定的回归顺序。

## 三、回归清单怎么写

回归清单应尽量把条目写成“可判断”的句子，而不是泛泛而谈。

| 模块 | 脚本化程度 | 重点判断 |
| --- | --- | --- |
| 休眠唤醒定位 | 高 | 唤醒后是否快速恢复定位 |
| 上电定位 | 高 | 首次定位和首帧是否按时出现 |
| 长稳运行 | 高 | 是否出现慢性漂移或掉状态 |
| 平台上报 | 高 | 是否按周期发送、失败后是否补发 |
| SOS | 中 | 触发源、关键字段、本地保存是否正确 |
| 诊断联动 | 中 | 会话切换、响应码、复位后状态是否一致 |
| ECALL | 中 | 白名单、使能、呼叫和静音逻辑是否正确 |
| 4G/5G 与 APN | 中 | 切换后是否仍能恢复上报 |

这张表的意义不是把所有东西都自动化，而是先把“每次都要人工确认的内容”压缩成一份固定清单。

## 四、实际使用流程

流程一般是：

1. 先跑环境检查。
2. 再触发目标场景。
3. 同步抓日志和报文。
4. 最后看平台和终端是否一致。

如果中间哪一步失败，就直接把失败点记到清单里，不继续往下跑，避免把后面的结果都污染掉。

## 五、自动化的边界

不是所有内容都适合脚本化。

像示波器测时序、现场网络质量波动、或者某些需要人工观察的指示灯状态，往往还是要人工确认。

因此脚本更适合做成“半自动回归”：

- 能自动检查的尽量自动检查。
- 需要人工确认的地方留明确标记。
- 每次运行都输出统一格式的日志和结论。

## 六、小结

自动化测试脚本的价值不是替代所有人工工作，而是把高频、重复、容易漏的步骤先收拢起来。

这样一来，真正需要人盯住的就只剩下少数异常场景和边界问题，回归效率会高很多，排障也会更稳。

## 七、脚本逻辑拆解

自动化脚本按实际验证链路拆成几个模块。以下代码保留结构和判断方式，字段名使用通用示例。

这类脚本的核心不是写得多复杂，而是把一轮人工测试固化成可重复的机器流程：

1. 等待终端进入目标状态。
2. 下发唤醒或触发动作。
3. 检查网络和链路恢复。
4. 执行终端侧验证命令。
5. 把每一轮结果写成结构化日志，方便后续统计失败点。

对应到车载终端测试开发场景，可以拆成以下六个部分。

## 八、配置层：把环境变量收拢到一起

自动化脚本最怕参数散落。串口号、Wi-Fi 名称、SSH 地址、CAN 通道、循环次数这些内容，一旦写死在流程里，换一个台架就要到处改。

因此先做一个配置对象，把测试入口收拢起来：

```python
@dataclass(slots=True)
class TestConfig:
    serial_port: str
    serial_baudrate: int = 115200
    sleep_keyword: str = "sleepAck"
    sleep_timeout: float = 60.0
    wake_delay: float = 6.0
    wifi_profile: str = ""
    wifi_ssid: str = ""
    wifi_timeout: float = 45.0
    ssh_host: str = "192.168.0.1"
    ssh_user: str = "root"
    ping_target: str = "8.8.8.8"
    can_channel: str = "PCAN_USBBUS1"
    wake_arbitration_id: int = 0x43B
    wake_data_hex: str = "0102030405060708"
    cycles: int = 50
```

这里的参数可以分成四类：

| 类型 | 参数 | 作用 |
| --- | --- | --- |
| 终端状态 | `serial_port`、`sleep_keyword` | 判断终端是否进入休眠或目标状态 |
| 唤醒动作 | `can_channel`、`wake_arbitration_id`、`wake_data_hex` | 通过总线触发终端唤醒 |
| 网络恢复 | `wifi_profile`、`wifi_ssid`、`wifi_timeout` | 验证上位机和终端链路能否恢复 |
| 终端验证 | `ssh_host`、`ssh_user`、`ping_target` | 登入终端执行连通性检查 |

这样写的好处是，后面如果从 RT6 换到 RT7，或者 Wi-Fi 配置变化，只需要改入口参数，不需要改主流程。

## 九、状态监听：等到 `sleepAck` 再继续

自动化脚本不能靠固定 `sleep 30` 去猜终端状态。车载终端在休眠、唤醒、网络恢复时都有波动，固定等待时间要么太短导致误判，要么太长浪费回归时间。

串口日志里的关键字可以作为状态锚点：

```python
class SerialKeywordWatcher:
    def wait_for_keyword(self, keyword: str, timeout_seconds: float) -> str:
        deadline = time.time() + timeout_seconds
        keyword_lower = keyword.lower()

        while time.time() < deadline:
            raw = self._serial.readline()
            if not raw:
                continue

            line = raw.decode(errors="ignore").strip()
            if keyword_lower in line.lower():
                return line

        raise TimeoutError(f"Timed out waiting for serial keyword: {keyword}")
```

这段逻辑解决的是“什么时候开始下一步”的问题。

如果没有等到 `sleepAck`，说明终端可能没有真正进入休眠，后面即使发送唤醒帧，测试结论也不干净。因此这一层应直接失败，避免继续跑下去污染后面的结果。

## 十、唤醒动作：优先 PCAN，兼容 `cansend`

唤醒动作本质上就是向 CAN 总线发送一帧指定报文。

如果环境里有 `python-can`，脚本优先走 PCAN；如果是 Linux 或者已有 SocketCAN 工具，就可以退化到 `cansend`：

```python
class PcanWakeSender:
    def send(self, arbitration_id: int, data: bytes) -> None:
        if can is not None:
            self._send_with_python_can(arbitration_id, data)
            return

        cansend = shutil.which("cansend")
        if cansend:
            frame = f"{arbitration_id:X}#{data.hex().upper()}"
            subprocess.run([cansend, self._channel, frame], check=True)
            return

        raise RuntimeError("Neither python-can nor cansend is available.")
```

这一层需要保留失败抛错，而不是静默跳过。

因为 CAN 唤醒帧一旦没发出去，后面的 Wi-Fi 连接、SSH 检查全部都会失败。此时真正的问题在“唤醒没触发”，不是网络本身。

## 十一、网络恢复：连接 Wi-Fi 后再查状态

车载终端唤醒后，通常还要等 Wi-Fi 或局域网链路恢复。这里不能只执行一次连接命令就算通过，还要循环检查连接状态。

```python
class WindowsWifiConnector:
    def connect(self) -> None:
        cmd = ["netsh", "wlan", "connect", f"name={self.profile}"]
        if self.ssid:
            cmd.append(f"ssid={self.ssid}")
        subprocess.run(cmd, check=True, capture_output=True, text=True)

    def wait_connected(self, timeout_seconds: float) -> str:
        deadline = time.time() + timeout_seconds

        while time.time() < deadline:
            result = subprocess.run(
                ["netsh", "wlan", "show", "interfaces"],
                check=False,
                capture_output=True,
                text=True,
            )
            if "connected" in result.stdout.lower() or "已连接" in result.stdout:
                return result.stdout
            time.sleep(1.0)

        raise TimeoutError("Timed out waiting for Wi-Fi connection.")
```

这里的判断重点有两个：

- `connect` 只代表系统收到了连接请求，不代表链路已经可用。
- `wait_connected` 才是真正确认 Wi-Fi 状态的步骤。

如果测试环境里 Wi-Fi 名称、配置文件或者网卡状态不稳定，这一层能很快把问题暴露出来。

## 十二、终端验证：SSH 执行 `ping`

Wi-Fi 连上以后，还要确认终端侧网络真的能通。这里使用 SSH 进入终端执行 `ping`，而不是只在上位机本地 `ping` 终端。

```python
class SshPingRunner:
    def run_ping(self, target: str, count: int) -> str:
        cmd = [
            "ssh",
            "-o", "BatchMode=yes",
            "-o", f"ConnectTimeout={self.timeout}",
            f"{self.user}@{self.host}",
            f"ping -c {count} {target}",
        ]
        result = subprocess.run(cmd, check=False, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"SSH ping failed: {result.stderr}")
        return result.stdout.strip()
```

这样设计是为了区分两类问题：

| 现象 | 可能原因 |
| --- | --- |
| 上位机能连终端，但终端 `ping` 外网失败 | 终端路由、DNS、蜂窝网络或 APN 异常 |
| 上位机连不上终端 SSH | Wi-Fi、终端服务、IP 地址或防火墙异常 |

如果只在本地 `ping 192.168.0.1`，只能说明上位机到终端这一段通了，不能说明终端自己的外部链路正常。

## 十三、主流程：每一轮都记录失败阶段

主流程不要把所有动作揉成一大段。每一步都更新 `stage`，一旦失败就能知道停在哪个环节。

```python
for cycle in range(1, config.cycles + 1):
    stage = "wait_sleep"
    success = False

    try:
        sleep_marker = watcher.wait_for_keyword(
            config.sleep_keyword,
            config.sleep_timeout,
        )

        stage = "send_wake"
        can_sender.send(config.wake_arbitration_id, config.wake_payload)

        stage = "wake_settle"
        time.sleep(config.wake_delay)

        stage = "wifi_connect"
        wifi.connect()
        wifi.wait_connected(config.wifi_timeout)

        stage = "ssh_ping"
        ping_output = ssh.run_ping(config.ping_target, config.ping_count)
        success = True
    except Exception as exc:
        message = str(exc)
```

这一层最关键的是 `stage`。

如果 50 轮里失败了 8 轮，光看“失败”没什么价值。只有知道失败集中在 `wait_sleep`、`send_wake`、`wifi_connect` 还是 `ssh_ping`，才能继续定位是状态机、CAN、Wi-Fi 还是终端网络的问题。

## 十四、结果输出：用 JSONL 方便后续统计

每一轮结果写成一行 JSON，而不是只打印到终端。

```python
@dataclass(slots=True)
class CycleResult:
    cycle: int
    success: bool
    stage: str
    message: str
    duration_seconds: float
    timestamp: str
    sleep_marker: str = ""
```

单轮结果类似这样：

```json
{
  "cycle": 17,
  "success": false,
  "stage": "wifi_connect",
  "message": "Timed out waiting for Wi-Fi connection.",
  "duration_seconds": 52.31,
  "timestamp": "2026-02-21T19:42:08",
  "sleep_marker": "sleepAck received"
}
```

这样后续可以很容易统计：

- 总共跑了多少轮。
- 哪些轮失败。
- 失败集中在哪个阶段。
- 每一轮耗时是否异常。
- 串口关键字是否按预期出现。

如果要继续增强，可以再加一层汇总：

```python
summary = {
    "total": len(results),
    "passed": passed,
    "failed": failed,
    "output_dir": str(config.output_dir),
}
```

这比人工翻终端输出可靠很多，也方便后续把结果贴到测试报告里。

## 十五、运行方式和前置依赖

这类脚本真正运行前，要先确认四类依赖：

| 依赖 | 用途 |
| --- | --- |
| `pyserial` | 读取串口日志 |
| `python-can` 或 `cansend` | 发送 CAN 唤醒帧 |
| Windows `netsh` | 自动连接 Wi-Fi |
| `ssh` 命令 | 登录终端执行验证命令 |

运行入口可以设计成这样：

```bash
python car-terminal-automation-test-scripts.py ^
  --serial-port COM3 ^
  --wifi-profile RT6_TEST ^
  --wifi-ssid RT6_TEST ^
  --ssh-host 192.168.0.1 ^
  --ssh-user root ^
  --cycles 50
```

这里的 `COM3`、`RT6_TEST`、`192.168.0.1` 都只是示例。真正使用时应按台架环境替换。

## 十六、这段脚本最适合讲什么

作为项目内容展示时，重点不是代码行数，而是它解决了哪些测试问题：

- 把休眠唤醒、Wi-Fi 恢复、SSH 验证串成了固定流程。
- 每轮都能定位失败阶段，不需要人工反复回忆当时停在哪一步。
- 支持连续多轮回归，能暴露偶发失败和稳定性问题。
- 输出 JSONL 结果，后续可以继续接测试报告或统计脚本。

这才是自动化脚本对测试开发岗位最有价值的地方：不是单纯替人工点按钮，而是把容易漏、容易混、容易复现不稳定的问题收敛成可追踪的数据。
