---
layout: BookLayout
title: "Eloquent Route Presenter"
date: 2022-11-29T00:00:00.000Z
---

# Eloquent Route Presenter

This week Bikram Tuladhar shared route presenter for Laravel which leverages Laravel Eloquent to generate URL. Eloquent Route Presenter populates URL like `$model->route->index` from a model. Below is the trait which contains all the logic to generate URL.

<Gist id="5bec9336a3c71f57deb95da8d79b18a7" />

This trait populates common restful routes (i.e. CRUD routes) by default. You can use this trait with any eloquent model and also overwrite the routes & route prefix as you need in the model class.

To overwrite and add new route use `$routes` variable in the model class:

```php
$routes = ['publish' => ['routename', 'route_parameter_name']];
```

Or:

```php
$routes = ['publish' => ['routename', 'id', 'relation_model->id']];
```

To manually specify different route prefix use `$routePrefix`:

```php
$routePrefix = 'user';
```

Example of using eloquent route presenter in model:

<Gist id="5a8c9d967ed002fc459a395e1572061f" />

Using route presenter in blade template:

<Gist id="ec0b989d30e6efa2e29aef9b9cb2c8ad" />

Above the example, `$user` model object can populate URL and inject a dynamic parameter to a route by using end route name as a function call.

Below there is implementation and usages:

```php
$user->route->view // https://app_url/user/1

$user->route->publish(['user' => $user->id, 'profile' => $user->profile->id])
// https://app_url/user/1/profile/1/publish
```
