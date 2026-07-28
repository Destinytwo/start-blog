---
title: "LangGraph 快速入门与原理剖析：从图结构到地震夜光评估智能体"
published: 2026-07-28
updated: 2026-07-28
draft: false
description: "用 State、Node、Edge 三个核心概念拆解 LangGraph 的运行方式，并通过旅游规划助手和地震应急夜光损失评估智能体两个案例说明条件分支、循环、人机协同和持久执行。"
image: "/blog-assets/earthquake-nightlight-agent-flow.svg"
tags: ["LangGraph", "LangChain", "智能体", "StateGraph", "工作流", "人机协同", "地震应急", "夜光遥感"]
category: "AI 智能体项目"
author: "Funny"
links:
  - kind: "project"
    id: "earthquake-nightlight-loss-agent"
    label: "地震应急夜光损失评估智能体"
---

## 写在前面

LangGraph 适合处理 **流程不止一步、执行中可能反复调整、需要保存状态、需要人工介入** 的智能体任务。它不是简单把多个提示词串起来，而是把智能体运行过程拆成一个可控制的图：每个节点负责一段计算，每条边决定下一步走向，状态贯穿整个流程。

如果任务只是“输入问题 -> 调用模型 -> 输出答案”，普通链式调用就够了。如果任务需要在中间检查、回退、重试、循环、等待用户确认，或者需要从断点恢复，LangGraph 会更适合。

本文先讲 LangGraph 的核心概念，再用一个旅游规划助手做入门示例，最后把同一套思想迁移到 **地震应急夜光损失评估智能体**：通过震后夜间灯光变化、灾区范围、人口和行政区数据，组织成一个可复核、可回退、可生成报告的应急评估流程。

![地震应急夜光损失评估智能体流程](/blog-assets/earthquake-nightlight-agent-flow.svg)

> 地震应急夜光损失评估智能体：确定地震事件和 AOI 后，自动组织夜光遥感数据、基准期对比、质量检查、损失估计和报告生成；在不确定性较高时进入人工复核。

## 一、为什么需要 LangGraph

很多早期 LLM 应用更像一条链：先做 A，再做 B，再做 C，最后输出结果。这种方式直观，但有几个明显限制：

- 中间结果不好确认，只有最终答案出来后才知道是否偏了。
- 很难回到某个中间环节重新生成。
- 状态管理容易散落在多个变量、缓存或数据库里。
- 一旦步骤变多，分支、循环、异常恢复会变得很难维护。
- 对需要人工审批的场景支持不自然。

LangGraph 的关键变化是把“链”变成“图”。图结构不是为了把代码写复杂，而是为了让智能体工作流可以表达真实流程：

| 需求 | 链式流程的难点 | 图结构的处理方式 |
| --- | --- | --- |
| 中途确认 | 通常只能等最终输出 | 在任意节点后加入审核节点 |
| 结果不满意 | 很难回到具体步骤 | 条件边可以回到指定节点 |
| 多轮循环 | 容易写成嵌套判断 | 用边显式表达循环 |
| 长任务恢复 | 中断后要自己保存上下文 | 通过检查点保存状态 |
| 多工具协作 | 流程控制容易混乱 | 每个工具封装成节点 |

LangGraph 的价值不在于“又多了一个框架”，而在于把复杂智能体从一团过程代码变成可读、可调试、可恢复的图。

## 二、核心概念：State、Node、Edge

LangGraph 入门可以先抓住三个词：`State`、`Node`、`Edge`。

![LangGraph State Node Edge 关系](/blog-assets/langgraph-state-node-edge-flow.svg)

### 1. State：贯穿全流程的上下文

`State` 是整个图共享的数据结构，保存当前任务已经知道的内容。节点读取 State，处理后返回新的字段或字段更新，图运行时把这些更新合并回 State。

常见 State 字段包括：

- 用户输入
- 对话消息
- 中间计算结果
- 工具调用结果
- 当前步骤状态
- 审核意见
- 错误信息
- 最终报告

State 可以理解成“智能体的工作台”。任务越复杂，越需要一个清晰的 State 设计，否则后续节点不知道前面到底产生了什么。

### 2. Node：执行具体任务的函数

`Node` 是图里的计算步骤，本质上通常就是 Python 函数。它接收当前 State，执行一段明确任务，然后返回 State 的增量更新。

节点可以做很多事：

- 调用大模型生成内容。
- 调用检索工具查资料。
- 读取遥感影像或表格数据。
- 执行 Python / GIS / 图像处理算法。
- 判断数据质量。
- 生成报告。
- 等待人工审核。

节点最好保持职责单一。比如“获取夜光影像”和“计算亮度变化”应该拆成两个节点，而不是塞进一个巨大函数里。

### 3. Edge：控制流程怎么走

`Edge` 用来连接节点，决定一个节点执行完之后进入哪个节点。

边有两类：

- 普通边：固定从 A 走到 B。
- 条件边：根据 State 的某个字段决定下一步走到 B、C 还是结束。

条件边是 LangGraph 很重要的能力。它让智能体可以做预算判断、质量检查、人工审批、失败重试、循环修正，而不是只能一路向下执行。

## 三、LangGraph 和 LangChain 的区别

LangChain 更偏“组件和链式调用”：模型、提示词、检索器、工具、输出解析器等都能组合起来。它适合构建单次调用或相对线性的流程。

LangGraph 更偏“流程编排和状态管理”：把模型、工具、人工环节、条件判断、循环和持久化放进一个图里。它适合长期运行、可恢复、有分支的智能体。

可以这样理解：

```text
LangChain 更像积木和管道：
Prompt -> Model -> Parser -> Result

LangGraph 更像流程图和状态机：
State -> Node -> Condition -> Node -> Review -> Loop / End
```

两者不是替代关系。实际项目里经常是：节点内部使用 LangChain 组件，整体流程由 LangGraph 调度。

## 四、入门案例：旅游规划助手

先用一个轻量案例理解图结构。目标是构建一个旅游规划助手：

1. 读取用户偏好。
2. 推荐目的地。
3. 计算预算。
4. 如果预算超支，调整方案并重新计算。
5. 预算通过后生成行程。
6. 进入人工审核。
7. 审核通过后输出，不通过则按意见重新生成。

这个流程天然包含分支和循环：预算可能超支，行程可能被用户打回。用链式流程写会出现很多嵌套判断；用图结构则能清楚表达每一步。

### 1. 安装依赖

```bash
pip install -U langgraph langchain
```

如果需要接入具体模型，再按模型提供方安装对应 SDK。入门阶段可以先用普通函数模拟节点，先把图结构跑通。

### 2. 定义 State

```python
from typing import Literal
from typing_extensions import TypedDict


class TravelState(TypedDict, total=False):
    user_input: str
    destination: str
    budget_limit: int
    estimated_budget: int
    itinerary: str
    review_result: Literal["approved", "rejected"]
    review_comment: str
```

这里用 `TypedDict` 明确 State 里可能有哪些字段。`total=False` 表示字段不一定一开始都存在，后续节点可以逐步补充。

### 3. 编写节点函数

```python
def input_preference(state: TravelState) -> TravelState:
    return {
        "user_input": "想去海岛，预算 10000 元以内，时间 5 天",
        "budget_limit": 10000,
    }


def recommend_destination(state: TravelState) -> TravelState:
    # 真实项目中可以由 LLM 或检索结果生成候选目的地
    return {"destination": "巴厘岛"}


def calculate_budget(state: TravelState) -> TravelState:
    destination = state["destination"]
    price_map = {
        "巴厘岛": 6000,
        "马尔代夫": 16000,
        "普吉岛": 8000,
    }
    return {"estimated_budget": price_map.get(destination, 12000)}


def adjust_plan(state: TravelState) -> TravelState:
    return {"destination": "普吉岛"}


def generate_itinerary(state: TravelState) -> TravelState:
    return {
        "itinerary": (
            f"目的地：{state['destination']}\n"
            "Day 1：抵达并入住\n"
            "Day 2：海滩与当地市场\n"
            "Day 3：浮潜或周边岛屿\n"
            "Day 4：自由活动\n"
            "Day 5：返程"
        )
    }


def human_review(state: TravelState) -> TravelState:
    # 示例中用固定结果模拟人工审核
    return {"review_result": "approved", "review_comment": "行程合理"}


def user_modify(state: TravelState) -> TravelState:
    return {"review_comment": "减少购物时间，增加自然景点"}


def final_output(state: TravelState) -> TravelState:
    print(state["itinerary"])
    return {}
```

节点函数只做一件事：读 State，返回 State 更新。这样每一步都能单独调试。

### 4. 编写条件路由

预算检查和人工审核都适合用条件边。

```python
def budget_router(state: TravelState) -> Literal["generate_itinerary", "adjust_plan"]:
    if state["estimated_budget"] <= state["budget_limit"]:
        return "generate_itinerary"
    return "adjust_plan"


def review_router(state: TravelState) -> Literal["final_output", "user_modify"]:
    if state["review_result"] == "approved":
        return "final_output"
    return "user_modify"
```

这两个函数本质上就是“根据当前 State 决定下一步”。预算通过就生成行程；预算超支就调整方案；审核通过就输出；审核不通过就进入修改节点。

### 5. 构建图

```python
from langgraph.graph import END, START, StateGraph


workflow = StateGraph(TravelState)

workflow.add_node("input_preference", input_preference)
workflow.add_node("recommend_destination", recommend_destination)
workflow.add_node("calculate_budget", calculate_budget)
workflow.add_node("adjust_plan", adjust_plan)
workflow.add_node("generate_itinerary", generate_itinerary)
workflow.add_node("human_review", human_review)
workflow.add_node("user_modify", user_modify)
workflow.add_node("final_output", final_output)

workflow.add_edge(START, "input_preference")
workflow.add_edge("input_preference", "recommend_destination")
workflow.add_edge("recommend_destination", "calculate_budget")

workflow.add_conditional_edges(
    "calculate_budget",
    budget_router,
    {
        "generate_itinerary": "generate_itinerary",
        "adjust_plan": "adjust_plan",
    },
)

workflow.add_edge("adjust_plan", "calculate_budget")
workflow.add_edge("generate_itinerary", "human_review")

workflow.add_conditional_edges(
    "human_review",
    review_router,
    {
        "final_output": "final_output",
        "user_modify": "user_modify",
    },
)

workflow.add_edge("user_modify", "generate_itinerary")
workflow.add_edge("final_output", END)

graph = workflow.compile()
graph.invoke({})
```

这个图里有两个循环：

- `adjust_plan -> calculate_budget`：预算不通过就继续调整。
- `user_modify -> generate_itinerary`：人工审核不通过就重新生成。

流程不再靠大段 `if/else` 隐藏在函数内部，而是直接暴露在图结构里。

## 五、运行原理：状态补丁和图调度

LangGraph 节点通常不直接修改整个 State，而是返回一个“状态补丁”。运行时会把补丁合并回 State，再交给下一节点。

简化后的执行模型可以理解为：

```text
读取当前 State
  -> 执行当前 Node
  -> 得到 State update
  -> 合并 State
  -> 根据 Edge / Conditional Edge 选择下一个 Node
  -> 直到 END
```

这样设计有几个好处：

1. 每个节点的输入和输出清楚。
2. 中间状态可检查，便于调试。
3. 条件边可以基于最新状态做判断。
4. 引入检查点后，可以从某个状态继续执行。

复杂智能体最怕“过程不可见”。LangGraph 的图结构让每一步都能定位：当前在哪个节点、State 里有什么、下一步为什么走这个分支。

## 六、人机协同为什么重要

很多智能体不能完全自动闭环，尤其是报告生成、代码修改、应急分析、财务审批、医学辅助等场景。中间结果必须给人看，必要时还要允许人修改 State。

在 LangGraph 里，人机协同可以设计成一个普通节点，也可以结合中断机制和检查点，让流程暂停在关键位置。典型模式是：

```text
模型生成初稿
  -> 质量检查
  -> 人工审核
  -> 通过：生成最终结果
  -> 不通过：写入修改意见并回到生成节点
```

这种流程的重点不是“让人最后看一眼”，而是在关键节点把人放进流程里。比如地震应急评估中，夜光变化可能受到云、月光、节假日、传感器差异和电力调度影响，自动结果不能直接当成最终结论。高风险区域、异常区域和低置信度结果都应该进入人工复核。

## 七、迁移到地震应急夜光损失评估智能体

地震发生后，夜间灯光数据可以作为宏观应急评估的一个辅助信号。某些区域震后灯光明显下降，可能对应电力中断、人口活动下降、基础设施损坏或交通管制。夜光不能直接等价为经济损失，但可以作为快速筛查和变化识别的输入之一。

这个项目可以拆成以下节点：

| 节点 | 作用 | 典型输出 |
| --- | --- | --- |
| `parse_event` | 读取地震时间、震中、震级和影响范围 | 事件结构化信息 |
| `build_aoi` | 根据震中和行政区生成 AOI | 评估范围 |
| `fetch_nightlight` | 获取震前和震后夜光数据 | 栅格文件路径 |
| `preprocess_raster` | 重采样、裁剪、投影统一、异常值处理 | 标准化影像 |
| `compare_baseline` | 与震前基准期对比 | 亮度变化图 |
| `quality_check` | 检查缺测、异常、变化可信度 | 质量评分 |
| `estimate_loss` | 结合人口、行政区、夜光变化估计影响等级 | 损失评估表 |
| `human_review` | 人工复核低置信度区域 | 修改意见 |
| `generate_report` | 输出图表、文字总结和应急建议 | 报告正文 |

这类项目为什么适合 LangGraph：

- 遥感预处理是确定性流程，适合封装成固定节点。
- 质量检查存在分支，低质量结果要回到数据处理或进入人工复核。
- 报告生成可以由 LLM 辅助，但结论需要受控。
- 应急任务可能长时间运行，需要保存中间状态。
- 每次运行的 AOI、数据版本、参数、判断理由都需要留痕。

## 八、智能体 State 设计

地震夜光评估智能体的 State 可以这样设计：

```python
from typing import Literal
from typing_extensions import TypedDict


class QuakeNightlightState(TypedDict, total=False):
    event_id: str
    event_time: str
    epicenter: tuple[float, float]
    magnitude: float
    aoi_geojson: str

    pre_event_raster: str
    post_event_raster: str
    baseline_raster: str
    change_map: str

    quality_score: float
    quality_notes: list[str]
    loss_table: list[dict]
    uncertainty_level: Literal["low", "medium", "high"]

    review_result: Literal["approved", "needs_revision"]
    review_comment: str
    report_markdown: str
```

这里把地震事件、遥感数据、质量检查、损失估计、人工审核和报告都放进同一个 State。后续节点只需要关注自己负责的字段。

## 九、智能体流程骨架

下面是一个工程骨架，重点展示 LangGraph 怎么组织流程，不绑定具体数据源。

```python
from typing import Literal
from langgraph.graph import END, START, StateGraph


def parse_event(state: QuakeNightlightState) -> QuakeNightlightState:
    return {
        "event_id": "EQ-2026-001",
        "event_time": "2026-07-28T00:00:00+08:00",
        "epicenter": (30.5, 103.9),
        "magnitude": 6.2,
    }


def build_aoi(state: QuakeNightlightState) -> QuakeNightlightState:
    return {"aoi_geojson": "output/aoi/eq-2026-001.geojson"}


def fetch_nightlight(state: QuakeNightlightState) -> QuakeNightlightState:
    return {
        "pre_event_raster": "data/nightlight/pre_event.tif",
        "post_event_raster": "data/nightlight/post_event.tif",
        "baseline_raster": "data/nightlight/baseline_30d.tif",
    }


def preprocess_raster(state: QuakeNightlightState) -> QuakeNightlightState:
    return {"quality_notes": ["projection aligned", "aoi clipped"]}


def compare_baseline(state: QuakeNightlightState) -> QuakeNightlightState:
    return {"change_map": "output/change/nightlight_delta.tif"}


def quality_check(state: QuakeNightlightState) -> QuakeNightlightState:
    # 实际项目中可检查缺测比例、异常亮度、覆盖范围和变化强度
    return {"quality_score": 0.86, "uncertainty_level": "medium"}


def estimate_loss(state: QuakeNightlightState) -> QuakeNightlightState:
    return {
        "loss_table": [
            {"region": "A 区", "light_drop": 0.31, "impact": "high"},
            {"region": "B 区", "light_drop": 0.12, "impact": "medium"},
        ]
    }


def human_review(state: QuakeNightlightState) -> QuakeNightlightState:
    return {"review_result": "approved", "review_comment": "结果可进入报告"}


def generate_report(state: QuakeNightlightState) -> QuakeNightlightState:
    return {
        "report_markdown": (
            "# 地震应急夜光变化评估报告\n\n"
            "本次评估基于震前基准夜光与震后夜光差异，"
            "结合行政区统计结果生成影响等级。"
        )
    }


def route_quality(state: QuakeNightlightState) -> Literal["estimate_loss", "human_review"]:
    if state["quality_score"] >= 0.8 and state["uncertainty_level"] != "high":
        return "estimate_loss"
    return "human_review"


def route_review(state: QuakeNightlightState) -> Literal["estimate_loss", "preprocess_raster"]:
    if state["review_result"] == "approved":
        return "estimate_loss"
    return "preprocess_raster"


workflow = StateGraph(QuakeNightlightState)

workflow.add_node("parse_event", parse_event)
workflow.add_node("build_aoi", build_aoi)
workflow.add_node("fetch_nightlight", fetch_nightlight)
workflow.add_node("preprocess_raster", preprocess_raster)
workflow.add_node("compare_baseline", compare_baseline)
workflow.add_node("quality_check", quality_check)
workflow.add_node("human_review", human_review)
workflow.add_node("estimate_loss", estimate_loss)
workflow.add_node("generate_report", generate_report)

workflow.add_edge(START, "parse_event")
workflow.add_edge("parse_event", "build_aoi")
workflow.add_edge("build_aoi", "fetch_nightlight")
workflow.add_edge("fetch_nightlight", "preprocess_raster")
workflow.add_edge("preprocess_raster", "compare_baseline")
workflow.add_edge("compare_baseline", "quality_check")

workflow.add_conditional_edges(
    "quality_check",
    route_quality,
    {
        "estimate_loss": "estimate_loss",
        "human_review": "human_review",
    },
)

workflow.add_conditional_edges(
    "human_review",
    route_review,
    {
        "estimate_loss": "estimate_loss",
        "preprocess_raster": "preprocess_raster",
    },
)

workflow.add_edge("estimate_loss", "generate_report")
workflow.add_edge("generate_report", END)

graph = workflow.compile()
result = graph.invoke({})
print(result["report_markdown"])
```

这个骨架里，`quality_check` 是关键分支点。如果夜光变化图质量可靠，就进入损失估计；如果质量不足，就进入人工复核。人工复核通过后继续估计，不通过则回到预处理节点调整参数。

## 十、工程实现时的几个关键点

### 1. State 不要设计得过散

State 字段应该围绕业务流程组织，而不是把所有临时变量都塞进去。可以保留事件信息、数据路径、质量结果、评估表、审核意见和报告结果，临时中间变量放在节点内部处理即可。

### 2. 节点命名要体现业务动作

节点名不要叫 `step1`、`process2`。更好的命名是 `fetch_nightlight`、`compare_baseline`、`quality_check`、`generate_report`。图一大，命名就是文档。

### 3. 条件边要少而关键

不是每一步都需要条件边。条件边应该放在真正影响流程方向的地方，比如预算是否超支、质量是否达标、人工审核是否通过。

### 4. LLM 不要替代确定性计算

地震夜光评估里，投影转换、栅格裁剪、像元计算、行政区统计都应该由确定性代码完成。LLM 更适合做解释、摘要、报告草稿和异常提示，不适合直接凭空给出损失数字。

### 5. 报告结论要带不确定性

夜光下降可能来自地震，也可能来自云、停电调度、节假日、传感器差异或数据缺测。因此报告里要保留质量评分、数据时间、数据源、变化阈值和不确定性等级，避免把辅助判断写成绝对结论。

## 十一、适合用 LangGraph 的任务特征

可以用下面的清单判断一个任务是否适合 LangGraph：

- 是否有多个步骤。
- 是否需要中途判断。
- 是否可能回退或循环。
- 是否需要人工确认。
- 是否需要长时间运行。
- 是否需要保存中间状态。
- 是否需要调用多个工具。
- 是否需要把模型生成和确定性代码结合起来。

满足三项以上，就可以考虑用 LangGraph。只做一次问答或一次文本改写，则没有必要把流程图化。

## 十二、总结

LangGraph 的核心可以压缩成一句话：**用 State 保存上下文，用 Node 执行任务，用 Edge 控制流程。**

从旅游规划助手到地震应急夜光损失评估智能体，本质上都是同一套结构：

```text
输入任务
  -> 拆成多个节点
  -> 每个节点更新 State
  -> 条件边决定下一步
  -> 必要时进入人工复核
  -> 最终输出可追踪结果
```

这套设计让智能体不再只是一次模型调用，而是一个可恢复、可检查、可迭代的工程流程。对于应急评估、遥感分析、报告生成这类既需要自动化又需要可靠性的任务，LangGraph 的图结构能把“模型能力”和“业务流程控制”分开，降低复杂度，也方便后续扩展。

## 参考资料

- [LangGraph 官方文档：Overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangGraph 官方教程：Build a basic chatbot](https://langchain-ai.github.io/langgraph/tutorials/get-started/1-build-basic-chatbot/)
- [LangGraph 官方概念：Persistence](https://langchain-ai.github.io/langgraph/concepts/persistence/)
