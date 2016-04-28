# The Wild World of Modeling

## 1 Overview

This is a presentation that I gave (April 28, 2016) to a graduate student led temporal and spatial modeling seminar at UC Berkeley. Here I present a number of ideas in mathematical and statistical modeling from the point of view of both theoretical and practical implementation.  

[Quick reference on model thinking](http://thru-echoes.github.io/learning-to-model/)  

#### 1.1 Concepts  

I plan to cover topics in implementing model thinking both conceptually and numerically, including:

* discrete vs continuous time
* parametric vs non parametric models
* feature importance and model validity: p-values vs residuals, k-near neighbors clustering for variable importance, cross-validation etc
* Anscombe's quartet

I plan to describe some issues in the practical implementation of modeling, including:

* value of interpretation: e.g. decision trees vs random forest
* accessibility: ease of use vs statistical / mathematical stability - desktop software vs web based approaches

#### 1.2 A Disease Example

We will use a reoccurring example throughout this presentation of a disease model. This model was implemented and taught by myself and others from the Getz lab - *Wayne Getz at UC Berkeley* - at <strong>TeenTechSF 2016</strong>.

Let's assume you have 1000 individuals within some population - for example within a typical American High School during Flu season. Of the 1000 students, 999 are healthy, flu-less, studious individuals. However, there is 1 infected individual! In our model of this disease we conceptualize this as <strong>999 susceptible and 1 infected</strong>.

## 2 The Issues of Time

There are two general ways to conceptualize the use of time within a model:

*discrete time* - the model consistently increments in <code>t + 1</code> with each iteration of the simulation

*continuous time* - the model uses <code>dt</code> to integrate over "slopes" of time in a continuous manner

#### 2.1 Discrete Time

We can think about discrete time in a simple step-wise manner. The simulation has a set of values, e.g. the number of susceptible students and the number of infected students, at <strong>time t</strong>. Well what happens when we move to the next day (assuming our model clock is in units *days*)? We can step from time *t* to time *t + 1* and update all simulation variables / parameters before or after the time iteration. This is an important distinction! If we are updating beforehand than any functions that take *time* are using <code>time = t</code> and <strong>NOT</strong> <code>time = t + 1</code> like they would with post-updating! This can cause major differences in simulation output and behavior.

#### 2.2 Continuous Time

We can think about continuous time as a differential equation problem. This can seem daunting...but have no fear because the visual language of the [Nova software](https://www.novamodeler.com/) is here to help! More below...

Instead of updating the model clock by steps, we integrate over a slope from <code>time = t</code> to <code>time = t + 1</code> through <strong>n number of dt "steps" / "bins"</strong>. What this means is that the integration of your model parameters occurs as a function of your dt (change of time) "step". These dt values can be thought of more as bins. It is the same way you would integrate on paper in a calculus class (or whatever class you may be integrating things in).    

#### 2.3 Change Over Time

Deciding which time approach a simulation takes is so underrated and so very, very important!

[DISCRETE_STOCH_SIRV_EXAMPLE]()

[CONTINUOUS_STOCH_SIRV_EXAMPLE]()

## 3 Parametric or Non-parametric

#### 3.1 Linear Assumptions

Linear regression is a non-parametric statistical model. Linear models assume the data is linear...but much more! Linear models assume the following:

* there is a linear relationship between the response (Y) and the predictors (X)
* the errors / noise of the predictors / variables / x are equal
* these errors (above) are independent and they are Gaussian (i.e. variance distribution)

#### 3.2 Reference into Anscombe's Quartet

One of my favorite statistical examples / illustrative exercises:

[Notes about linear model assumptions and Anscombe's quartet](http://statweb.stanford.edu/~nzhang/203_web/lecture3.pdf)

## 4 Model Validity

Let's take linear models as an example - extending from what is described above.

#### 4.1 Wrong Time for Linear Regression

Here we can check out both the <strong>binomial</strong> and <strong>tree-methods</strong> files - examples / referenced from a wonderful set of <code>R</code> tutorials.

But one of the most famous and obvious examples can be seen in Anscombe's quartet below.  

#### 4.2 Anscombe's Quartet

Are *p-values* and other forms of model validity testing really valid?

[Anscombe's quartet wiki](https://en.wikipedia.org/wiki/Anscombe's_quartet)

[A bit more detailed of a review of Anscombe's quartet](http://data.heapanalytics.com/anscombes-quartet-and-why-summary-statistics-dont-tell-the-whole-story)

[A very detailed / heavily mathematical review of Anscombe's quartet](http://www.mit.edu/~6.s085/notes/lecture4.pdf)
