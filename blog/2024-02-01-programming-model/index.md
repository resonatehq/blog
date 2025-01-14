---
slug: programming-model
title: What is a programming model?
authors: [dtornow]
tags: [distributed async await, programming model]
---

As software engineers, we are familiar with a range of programming models, for example imperative, functional, declarative, or object-oriented programming. These paradigms are tools in our toolbelt, each influencing our approach to solving problems.

At Resonate HQ, we are building a novel programming model, **Distributed Async Await**. Distributed Async Await extends async await beyond the boundaries of a single process, making distributed computing a first-class citizen.

So in this blog post, we will address the question "What is a programming model?"

<!-- truncate -->

## Programming Model

**A programming model or programming paradigm is a conceptual framework that guides and constrains how we think about problems and their solutions.**

Like any conceptual framework, a programming model is a set of concepts, relationships among these concepts, and constraints on the relationships.
For example, in object-oriented programming, core concepts are Classes and Inheritance relationships between Classes. Inheritance relationships are constrained to form a directed acyclic graph.

When choosing an object oriented programming language, this framework is the lense through which we reason about problems and their solutions. In the context of object oriented languages, the lens even has a name: the lens through which we view problems is called object oriented analysis and the lens through which we view solutions is called object oriented design.

## Beyond Programming Languages

However, a programming model is not only defined by a programming language but by the totality of the environment. Libraries, frameworks, and platforms have the ability to change the set of concepts, relationships, and contstraints.

For example, even when writing object oriented programs, your programs change significantly when you add threads. Your programs do not stop being object oriented programs, but they start to become concurrent programs, a change that forces you to think about problems and solutions differently than before.

Even seemingly small changes can have big impacts. For example, adding retries in case of failure changes the execution semantics from at most once to at least once, requiring you to look at the problem and the solution in a different light. Now you have to ensure that all of your functions are idempotent to guarantee correctness.

## Distributed Async Await

Resonate's vision is to provide a programming model for distributed applications that not only meets technical demands but provides a delightful developer experience based on traditional async await.

Async await is a programing model that allows the developer to express the **concurrent structure** of function executions. In effect, async await allows the developer to express concurrency and coordination on one machine.

Distributed Async Await is a programing model that extends async await and allows the developer to express the **distributed structure** of function executions. In effect, Distributed Async Await allows the developer to express concurrency and coordination across machines.

By extending instead of replacing async await, we've created an incremental transition from the world of concurrent programming models into the world of distributed programming models. You don't have to rewire your brain, instead you can build on your knowledge and experience to extend your horizon.

🏴‍☠️
