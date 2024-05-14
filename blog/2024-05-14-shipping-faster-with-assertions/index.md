---
slug: shipping-faster-with-assertions
title: Shipping Faster with Assertions
authors: [gguerra]
tags: []
---

Assertions are widely used in testing frameworks such as JUnit (for Java), Jest (for JavaScript), Pytest (for Python), and many others. These frameworks employ assertions to verify the expected external behavior of the system under test (SUT). However, it is less common for developers to use assertions within the production code of the SUT itself. In this post, I’ll explain how internal assertions can help developers ship code faster by catching bugs early, improving code quality and documenting expected behavior.

# What are Assertions?

An assertion is a condition that must always be true. If the conditions is found to be false, the application will terminate. Many programming languages such as Python, Java, C#, Rust and more natively support assertions.

```bash
// Python
assert input != 0, "input must be non zero"

// Java
assert input != 0 : "input must be non zero";

// C#
System.Diagnostics.Debug.Assert(input != 0, "input must be non zero");

// Rust
assert!(input != 0, "input must be non zero");
```

## Two Types of Assertions

At Resonate, we consider two types of assertions when writing applications:

1. **_External Assertions_**: These assertions are found in our testing code which relies on the public interface of the SUT and treats it as a black box, without access to its internal state or intermediate steps.

2. **_Internal Assertions_**: These assertions are inside our production code and therefore have access to the internal state and intermediate steps of the SUT, allowing them to make assertions about the system’s internal correctness.

# Benefits of Using Internal Assertions

The largest benefits of using internal assertions is that it forces you to think about your code in terms of invariants, preconditions, and postconditions. What are those and why should you care?

## Invariants

An invariant is a condition that holds true through the execution of a particular code segment, such as a method or even the life time of the application. There are two common types of invariants: preconditions and post conditions.

### Preconditions

A precondition is a condition that must be true before a specific operation is executed. It specifies the assumptions that must be met by the caller of the method.

```python
def something(input):
    # precondition

    result = do()

    return result
```

### Postconditions

A postcondition is a condition that must be true after a specific operation has completed its execution. It specifies the expected outcome or the guarantees provided by the method upon completion.

```python
def something(input):
    # precondition

    result = do()

    # postcondition

    return result
```

The combination of invariants, preconditions, and postconditions help catch bugs earlier because they cannot be ignored! They also serve as better code comments than code comments. Unlike regular comments, internal assertions cannot be outdated because the program with halt!

# Internal Assertions vs Error Handling

The biggest concern is knowing when to use assertions vs regular old error handling. At Resonate, we consider two types of errors when writing applications:

1. **_Expected Errors_**: know how to handle the error at the same layer in the software. This might require propagating the error to upper layers of the software.

2. **_Unexpected Errors_**: should kill the application immediately without propagating the error further.

With those two types of errors you can see that assertions are a great fit for unexpected errors. These are errors that break the assumptions you made of how your software works which is why they are unexpected. Another way to think of this is that assertions detect developer errors while error handling detects user errors. User errors are expected and can be handled, while assertion errors signal a misunderstanding of what is possible in your program.

In case an invariant is violated, we want to ensure that "nothing bad will ever happen", therefore shutting down instead of taking another step (arguably, if an invariant is violated, something bad already happened, so you could say we want to ensure that "nothing else bad will happen").

# Property-Based Testing with Assertions

Property-based testing (PBT) uses random inputs to check the SUT for high-level invariants or properties. At Resonate, we believe the pairing of internal assertions and PBT provides a powerful approach to ensuring code quality and reliability. This combination allows for extensive exploration of code paths, increasing the likelihood of uncovering bugs and edge cases that may be missed by traditional unit and integration tests.

# Evidence of Others Using Assertions

While this approach to using assertions is uncommon, a few notable pieces of software follow this approach.

- [LLVM](https://github.com/search?q=repo%3Allvm%2Fllvm-project+assert+language%3AC%2B%2B+path%3A%2F%5Ellvm%5C%2F%2F&type=code)

- [Postgres](https://github.com/search?q=repo%3Apostgres%2Fpostgres+assert+language%3AC+path%3A%2F%5Esrc%5C%2Fbackend%5C%2F%2F&type=code)

- [Linux Kernel](https://github.com/search?q=repo%3Atorvalds%2Flinux+assert%21+language%3ARust&type=code)

# Conclusion

Thinking about software in terms of invariants has positively shaped the speed and quality of software we deliver. For more examples of how we use assertions, please visit our [GitHub repository](https://github.com/resonatehq/resonate) and check it out for yourself.
