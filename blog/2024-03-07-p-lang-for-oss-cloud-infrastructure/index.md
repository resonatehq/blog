---
slug: p-lang-for-oss-cloud-infastructure
title: P-lang for OSS Cloud Infrastructure
authors: [gguerra]
tags: []
---

As open source software becomes critical infrastructure powering our online lives, ensuring correctness and reliability is crucial. In this post, I'll explain how formal modeling languages like [P](https://p-org.github.io/P/whatisP/) can help open source projects design distributed systems that work reliably at scale.

## What and Why Formal Methods?

Formal modeling is a technique that uses mathematically-based languages to define and verify software systems. The primary goal of formal modeling is to help developers clearly specify the expected behavior of a system before writing any code. This approach offers several key advantages:

1. **_Clarifying assumptions_**: Formal modeling acts as a thinking tool, forcing developers to make their implicit assumptions explicit. By clearly defining the system's behavior and constraints, developers can identify and address potential issues early in the development process.
2. **_Early detection of design issues_**: By modeling the system's behavior at a high level, developers can iterate and debug the design before writing any production code. This helps catch design flaws and inconsistencies early, saving time and effort in the long run.
3. **_Serving as documentation_**: Formal models can serve as technical specifications for new contributors, providing a clear and unambiguous description of the system's expected behavior. This helps new team members understand the system more quickly and reduces the risk of misinterpretation.

In recent years, the adoption of formal modeling has become more accessible thanks to new languages like P. These languages map formal modeling concepts to ideas that software engineers are already familiar with, such as state machines, events, and conditional logic. By using concepts that developers already understand, these languages lower the barriers to entry and make formal modeling more approachable for a wider range of software development teams.

## Modeling State Machines and Events

P represents distributed systems as communicating state machines, matching engineers' mental models. Additionally, P allows modeling various message delivery semantics (e.g., at most once, at least once, ordered, unordered) and failure scenarios (e.g., crash with/without recovery, persistent/volatile memory), but these must be explicitly implemented by the developer.

For example, here is some P code we are using to model a distributed worker protocol:

```p-lang title="PSrc/Worker.p"
// Payload type associated with eSubmitTaskReq.
type tSubmitTaskReq = (task: Task, taskId: int, counter: int);

// State machine modeling a stateless worker.
machine Worker {

  // Simulate volatile memory.
  var task: Task;
  var taskId: int;
  var counter: int;

  start state init {
    on eSubmitTaskReq goto ClaimTask with (req: tSubmitTaskReq) {
      task = req.task;
      taskId = req.taskId;
      counter = req.counter;
    }
  }

  state ClaimTask {
    entry {

      // Simulate message loss.
      if($) {
        send task, eClaimTaskReq, (worker = this, taskId = taskId, counter = counter);
      }

      goto WaitForClaimResponse;
    }

    // Simulate worker crash and restart.
    on eShutDown goto init;
  }

  // More states and events that a worker might experience...
}
```

## Safety and Liveness Specifications

In any distributed system, two crucial properties that developers must verify are safety and liveness:

- Safety - Nothing bad happens (no invalid state or crashes)
- Liveness - Something good eventually happens (tasks complete)

Verifying these properties can be challenging due to the combinatorial explosion problem, where many distributed system bugs only manifest under specific and rare conditions. To tackle this issue, a tool like P runs many possible interleaved schedules of events through your modeled state machines and tests against your system’s safety and liveness specifications. By exercising the system in various ways under a formal model, developers can identify and eliminate entire classes of bugs before proceeding to the implementation phase.

Here is a code snippet of the liveness specification we use for our distributed worker protocol:

```p-lang title="PSpec/ResonateWorkerCorrect.p"
// GuaranteedTaskProgress checks the global liveness (or progress) property that for every
// eTaskPending raised a corresponding eTaskResolved or eTaskRejected eventually follows
spec GuaranteedTaskProgress observes ePromisePending, ePromiseResolved, ePromiseRejected  {
  start state Init {
      on ePromisePending goto Pending;
  }

  // Eventually you want to leave the hot state and go to a cold state.
  hot state Pending {
      on ePromiseResolved goto Resolved;
      on ePromiseRejected goto Rejected;
  }

  cold state Resolved {}

  cold state Rejected {}
}
```

## Benefits for Open Source Projects

Open source communities are ready to shake up distributed systems development by embracing formal modeling techniques. Like how test-driven development changed software engineering, formal modeling can really boost the quality, understandability and reliability of complex networked systems made by open source projects.

## Conclusion

We are seeing notable achievements within Resonate by leveraging P to model and enhance new distributed components, like our worker protocol, prior to implementation. For the complete code base, please visit our [GitHub repository](https://github.com/resonatehq/p-resonate-workers) and checkout our model yourself.
