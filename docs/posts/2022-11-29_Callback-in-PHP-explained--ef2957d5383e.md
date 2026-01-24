---
layout: BookLayout
title: "Callback in PHP explained"
date: 2022-11-29T00:00:00.000Z
---

# Callback in PHP explained

A callback is a function that gets passed into another function as an argument where it is executed when the parent function wants it to be executed. Here is a quick example of a callback function.

<Gist id="e1cf7ec8dc91c0f4f5241c5d3411de0f" />

Above the example, we are using a callable function in `calculate` the method where it accepts closure or function name and function argument as arguments. `Calculate` method extract callable functions and arguments using `func_get_args()`. ReflectionFunction is used to fit arguments and invoke the function.

<Gist id="46db0ea96e9324e6fdff9ed11002acba" />

Above the example, we are using `call_user_func` to execute a callable function where it's the first parameter is the function name and the rest is arguments. Using `call_user_func` we can execute a function from another class too. Which is very handy in the case of refactoring code. Which is explained below in an example code snippet.

<Gist id="ffef9eccf880e57f80634e38ffc9a589" />

Above the example, we have three solutions for the same logic. In the first one, we are using closure to calculate the multiplication and we are writing all the logic inside the closure function. Alternatively, we have extracted the closure function to a normal PHP method name `multiplyByTen` which is called using the method name as a string. In the third approach, we have created a class `Cal` and defined a `multiply` method to use in callback calls using the array `[$cal, 'multiply']` as an argument to execute code from class `Cal`. This array is treated as `call_user_func_array`.

Furthermore, here is a nice example of various ways to call a callable function: [The Art of PHP Callback](https://www.exakat.io/the-art-of-php-callback/).

Just like in JavaScript we can use a variable for function definition and execute dynamically in PHP as well.

<Gist id="139e9b1c7e13f6501d0ac1cbf8effcb0" />

In the example above, we have created three variables `$multiply`, `$addition` and `$operate` as functions. These functions can be passed in callable which is executed accordingly.
