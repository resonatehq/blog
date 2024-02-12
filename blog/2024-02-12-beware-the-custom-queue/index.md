---
slug: beware-the-custom-queue
title: Beware the custom queue
authors: [dtornow]
tags: []
---

# Beware the custom queue

Every now and then, a blog post pops up in which the author details their journey behind constructing their own queueing subsystem for their project－more often than not in the form of their own job or task queue. These tales of technical triumphs and tribulations, while fun to read, often omit a pivotal question:

**Should you choose a technology that insists on implementing its own queuing subsystem?**

In this post, we'll explore the unseen challenges of custom queueing subsystems, and why they might not be the best choice for your application.

# Custom queueing subsystems

Choosing a technology that insists on implementing its queuing subsystem is a decision with significant considerations. As the tech landscape explodes with solutions claiming to offer the best in terms of scalability and reliability, we should explore the consequences when a technology brings its own queuing subsystem to the table.

# The theoretical benefit

Let's acknowledge － but put aside for a moment － that implementing a correct, scalable, and reliable queueing subsystem is a formidable engineering challenge. Unless the vendor has significant experience in building queueing subsystems, their custom queue is at risk to fall short of expectations.

At first glance, the integration of a custom queuing subsystem within a technology stack might appear as a promise that the technology is uniquely engineered to address specific challenges. But does this argument really hold up under scrutiny? 

During Prime Day 2023, AWS SQS processed 86 million messages per second. Today, AWS EventBridge matches more than 2.6 trillion events per month for over 1.5 million customers with diverse use cases. In light of these figures, a vendor's claim that their unique requirements necessitate a proprietary queuing subsystem deserve a healthy dose of skepticism.

# The practical drawback

The dubious claims of the benefit of a tailor made solution are met with the very real costs that come by adopting custom queues.

Queues are foundational technologies, deeply integrated within vast ecosystems, rather than standalone components.

Consider AWS offering Simple Queue Service (SQS) as part of an extensive ecosystem. SQS does not exist in isolation but is a cog in a much larger machine, seamlessly integrating with services like AWS EventBridge and AWS Lambda. These services provide advanced functionalities such as event matching, event routing, and serverless computing, all while ensuring robust security through embedded authentication, authorization, and comprehensive logging and monitoring features.

By insisting on their own proprietary queues, vendors shut the door on your application from taking advantage of a rich ecosystem－or, if you already made significant investments into this ecosystem, make it hard for you to reap the benefits.

# The vendor wolf in sheep's clothing

Forcing a user to commit to a proprietary queue serves as a "wolf in sheep's clothing", subtly promoting vendor lock-in. Opting for a proprietary queue ties a significant portion of your system to a single provider, effectively restricting future options. Such exclusivity forces you to  stake your success on the provider's technology.

%% Add in divorce process

When considering queuing solutions, the broader implications of vendor lock-in, and the benefits of a versatile, open architecture should guide your decision-making process. 

# The out-of-the-box argument

Vendors argue that because they embed their own queue, everything works out-of-the-box without the need to set up additional infrastructure.

That argument is a red herring: you can provide an out-of-the-box queueing solution that has the same status as other queueing systems. If the user has a choice between your queue and any other queue, the user is free to opt for an out-of-the-box or best-of-breed setup, never locked in into one choice, free to make changes, and free from vendor lock in.

# The Solution

Implementing a custom queueing subsystem need not exclude the embrace of established queueing solutions. By adhering to a philosophy of openness and interoperability, vendors can empower users with the freedom to choose between an out-of-the-box solution and the best-of-breed alternatives. Furthermore, this approach allows for the flexibility to reevaluate that choice as applications evolve.

# Conclusion

When evaluating a technology stack, consider carefully whether the technology mandates the use of its custom queueing subsystem. A balanced and flexible approach is one where the technology offers an out-of-the-box experience with its own queueing system but also supports seamless integration with alternative queueing providers.

But a technology that enforces the use of its own queue, denying you the freedom to choose, should be viewed with caution 

🚩