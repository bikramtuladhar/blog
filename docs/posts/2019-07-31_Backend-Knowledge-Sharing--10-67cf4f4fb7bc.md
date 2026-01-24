---
layout: BookLayout
title: "Backend Knowledge Sharing #10"
date: 2019-07-31T00:00:00.000Z
---

# Backend Knowledge Sharing #10

Global Loader Component and Laravel Pipe Dream to start your new project quicker.

![Backend Knowledge Sharing](https://cdn-images-1.medium.com/max/2560/1*UuZpqhUZ515u_pyjsX-zKg.png)

## Table of Contents

1. [Global Loader Component using Vue.js and Axios Interceptors](#global-loader-component-using-vuejs-and-axios-interceptors)
2. [Laravel Pipe Dream to start your new project quicker](#laravel-pipe-dream-to-start-your-new-project-quicker)

---

## Global Loader Component using Vue.js and Axios Interceptors

Modern frontend developments revolve around APIs more than tightly coupled backend systems. As we know, fetching and posting data through an API can take a substantial amount of time.

This can confuse users about the state of our application. If we keep user experience in mind, they should be aware of what is going on in the site. This week Sandip Shrestha shared his VueJs loader component and how to structure it in a Laravel application with Axios in detail.

You can read the detailed blog post [here](https://codeburst.io/global-loader-component-using-vue-js-and-axios-interceptors-3880a136a4ac).

---

## Laravel Pipe Dream to start your new project quicker

It takes quite a lot of time to scaffold a project from scratch, which, most of the time, includes repeated and simple but time-consuming tasks. This week Puncoz Nepal shared a package, [Laravel Pipe Dream](https://github.com/pipe-dream/laravel), developed by [Anders Jürisoo](https://github.com/ajthinking) that helps to scaffold a new project in Laravel really quickly and easily.

Laravel Pipe Dream takes a minimum of input in the form of a sketch/entity list which predicts our application schema and feeds it into a set of pipes. And these pipes generate all the files needed to get started with building the application.

Let's get started by installing the composer package in a fresh Laravel project.

```bash
composer require --dev pipe-dream/laravel
```

That's it, now we can access pipe dreams' UI interface in the browser with URL `/pipe-dream` and start designing.

In the sketch window, database tables and models should be listed in the form schema, which will generate required files like, models, controllers, routes and database migrations/seeds files. The basic syntax of the sketch schema list should be something like below:

```
// use PascalCase for Models
Garage
location
capacity

// Separate your entities into chunks
Car
color
user_id // foreign key

// use snake_case (model1_model2) to setup a ManyToMany relationship
car_garage

// use button to add a default user system
User
name
email
email_verified_at
password
remember_token

// use snake_case to create a table
password_resets
email
token
```

We can also edit the generated files by hand before generating them and save files on disk.

To learn more about the full capabilities of this package, including source code, documentation, and examples, check out the project on [GitHub](https://github.com/pipe-dream/laravel).

---

You can read our previous blog: [Backend Knowledge Sharing #9](https://blog.yipl.com.np/backend-knowledge-sharing-9-cdccc97dd8d0)
