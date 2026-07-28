---
title: "LangGraph 快速入门与原理剖析：State、Node、Edge 与可控智能体工作流"
published: 2026-07-28
updated: 2026-07-28
draft: false
description: "用 State、Node、Edge 三个核心概念拆解 LangGraph 的运行方式，并通过旅游规划助手案例说明条件分支、循环、人机协同、持久执行和复杂智能体工作流设计。"
image: "/blog-assets/langgraph-state-node-edge-flow.svg"
tags: ["LangGraph", "LangChain", "智能体", "StateGraph", "工作流", "人机协同", "持久化", "AI Agent"]
category: "AI 智能体项目"
author: "Funny"
links:
  - kind: "project"
    id: "earthquake-nightlight-loss-agent"
    label: "地震应急夜光损失评估智能体"
---

## 写在前面

LangGraph 是一个用于构建有状态智能体工作流的图编排框架。它适合处理 **流程不止一步、执行中可能反复调整、需要保存状态、需要人工介入** 的任务。

如果一个任务只是“输入问题 -> 调用模型 -> 输出答案”，普通 LLM 调用或者链式调用就够了。但只要流程里出现分支、循环、重试、审批、断点恢复、多工具协作，单纯的链就会越来越难维护。

LangGraph 的核心思路是把智能体运行过程拆成一张图：

- `State` 保存全流程共享上下文。
- `Node` 执行某一个具体步骤。
- `Edge` 决定节点之间怎么流转。

掌握这三个概念，就能理解 LangGraph 大部分工作方式。

![LangGraph State Node Edge 关系](/blog-assets/langgraph-state-node-edge-flow.svg)

## 一、为什么需要 LangGraph

很多早期 LLM 应用更像一条链：先做 A，再做 B，再做 C，最后输出结果。这种方式直观，但有几个明显限制：

- 中间结果不好确认，只有最终答案出来后才知道是否偏了。
- 很难回到某个中间环节重新生成。
- 状态管理容易散落在多个变量、缓存或数据库里。
- 一旦步骤变多，分支、循环、异常恢复会变得很难维护。
- 对需要人工审批的场景支持不自然。

LangGraph 的关键变化是把“链”变成“图”。图结构不是为了把代码写复杂，而是为了让智能体工作流可以表达真实流程。

| 需求 | 链式流程的难点 | 图结构的处理方式 |
| --- | --- | --- |
| 中途确认 | 通常只能等最终输出 | 在任意节点后加入审核节点 |
| 结果不满意 | 很难回到具体步骤 | 条件边可以回到指定节点 |
| 多轮循环 | 容易写成嵌套判断 | 用边显式表达循环 |
| 长任务恢复 | 中断后要自己保存上下文 | 通过检查点保存状态 |
| 多工具协作 | 流程控制容易混乱 | 每个工具封装成节点 |

LangGraph 的价值不在于“又多了一个框架”，而在于把复杂智能体从一团过程代码变成可读、可调试、可恢复的图。

## 二、核心概念：State、Node、Edge

LangGraph 入门先抓住三个词：`State`、`Node`、`Edge`。

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
- 最终输出

State 可以理解成“智能体的工作台”。任务越复杂，越需要一个清晰的 State 设计，否则后续节点不知道前面到底产生了什么。

### 2. Node：执行具体任务的函数

`Node` 是图里的计算步骤，本质上通常就是 Python 函数。它接收当前 State，执行一段明确任务，然后返回 State 的增量更新。

节点可以做很多事：

- 调用大模型生成内容。
- 调用检索工具查资料。
- 调用外部 API。
- 读取文件或数据库。
- 执行业务计算。
- 生成报告。
- 等待人工审核。

节点最好保持职责单一。比如“检索资料”和“生成总结”应该拆成两个节点，而不是塞进一个巨大函数里。节点越清晰，图越容易调试。

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

这种流程的重点不是“让人最后看一眼”，而是在关键节点把人放进流程里。模型可以负责生成和推理，人负责关键决策、风险判断和结果确认，流程则由图结构稳定承载。

## 七、持久执行和检查点

复杂智能体经常不是几秒内结束的任务。它可能要调用多个工具、等待用户输入、生成多个中间结果，甚至在某个节点暂停。此时如果进程中断，重新从头执行会浪费时间，也可能造成状态不一致。

LangGraph 的持久化能力通常通过 checkpointer 实现。图在运行时可以保存状态快照，后续继续执行时根据线程或会话标识恢复上下文。

可以把它理解成：

```text
每执行到关键节点
  -> 保存当前 State
  -> 如果流程中断
  -> 根据 thread_id 找回 State
  -> 从中断附近继续
```

持久执行解决的是工程可靠性问题。智能体不只是一次模型调用，而是一个可能运行很久、需要恢复和追踪的流程。

## 八、工程实现时的几个关键点

### 1. State 不要设计得过散

State 字段应该围绕业务流程组织，而不是把所有临时变量都塞进去。可以保留用户输入、检索结果、工具输出、质量检查、审核意见和最终结果，临时中间变量放在节点内部处理即可。

### 2. 节点命名要体现业务动作

节点名不要叫 `step1`、`process2`。更好的命名是 `retrieve_context`、`draft_answer`、`quality_check`、`human_review`、`final_output`。图一大，命名就是文档。

### 3. 条件边要少而关键

不是每一步都需要条件边。条件边应该放在真正影响流程方向的地方，比如预算是否超支、结果是否合格、人工审核是否通过、工具调用是否失败。

### 4. LLM 不要替代确定性计算

确定性计算、数据转换、格式校验、文件读写、数值统计等内容应该由代码完成。LLM 更适合做理解、生成、解释、摘要、决策辅助和工具选择。把两者边界分清，流程才稳定。

### 5. 失败路径要显式设计

工具调用失败、模型输出格式错误、检索结果为空、人工审核不通过，这些都不应该只靠异常栈处理。更好的方式是在 State 中记录错误信息，再通过条件边进入重试、修正或人工处理节点。

## 九、适合用 LangGraph 的任务特征

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

## 十、总结

LangGraph 的核心可以压缩成一句话：**用 State 保存上下文，用 Node 执行任务，用 Edge 控制流程。**

它解决的不是“怎么调用一个大模型”，而是“怎么把大模型放进一个可靠、可控、可恢复的工作流里”。

从旅游规划助手这类简单案例开始，可以逐步掌握三个层次：

1. 用 State 管理上下文。
2. 用 Node 拆分任务步骤。
3. 用 Edge 表达条件、循环和结束。

当流程开始出现人机协同、持久化、重试、回退、多工具编排时，LangGraph 的优势会越来越明显。它让智能体从一次性问答变成工程化流程，也让复杂 AI 应用更容易调试、扩展和维护。

## 参考资料

- [LangGraph 官方文档：Overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangGraph 官方教程：Build a basic chatbot](https://langchain-ai.github.io/langgraph/tutorials/get-started/1-build-basic-chatbot/)
- [LangGraph 官方概念：Persistence](https://langchain-ai.github.io/langgraph/concepts/persistence/)
