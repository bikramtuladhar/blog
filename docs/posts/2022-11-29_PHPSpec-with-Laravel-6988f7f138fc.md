---
layout: BookLayout
title: "PHPSpec with Laravel"
date: 2022-11-29T00:00:00.000Z
---

# PHPSpec with Laravel

Testing is time-consuming, complicated, and requires a separate environment setup. Sometimes it is just not feasible to test because the changes are too frequent. But deep down we know that we should always test critical functions, and classes. Bikram Tuladhar shared his testing setup in Laravel using PHPSpec.

[PHPSpec](https://www.phpspec.net/en/stable/) is a testing tool based on the concept of emergent design using the specification. It is very easy to set up with Laravel and other PHP frameworks.

Here are the steps to setup PHPSpec with Laravel:

## 1. Install PHPSpec from composer in Laravel project

```bash
composer require --dev phpspec/phpspec
```

## 2. Install PHPSpec Laravel extension from composer

Laravel-PHPSpec is an extension to enable Laravel's helper function and other Laravel goodies in PHPSpec.

```bash
composer require --dev bikramtuladhar/laravel-phpspec
```

## 3. Create a phpspec.yml file in the project root directory

```yaml
# phpspec.yml
suites:
  default:
    namespace: App
    psr4_prefix: App
    src_path: app
    spec_path: app
    spec_prefix: spec
extensions:
  PhpSpec\Laravel\Extension\LaravelExtension:
    testing_environment: testing
formatter.name: pretty
```

Namespace and other variables are customizable with proper PSR-4 setup in the composer.json file.

## 4. Extend PHPSpec class with LaravelObjectBehavior

This enables the bootstrapped Laravel environment.

Generate new PHPSpec test file using PHPSpec command:

```bash
./vendor/bin/phpspec describe App\RandomNamespace\RandomGenerator
```

Extend PHPSpec class with LaravelObjectBehavior:

```php
<?php

namespace spec\App\RandomNamespace;

use App\RandomNamespace\RandomGenerator;
use App\RandomClass;
use PhpSpec\Laravel\LaravelObjectBehavior;

class RandomGeneratorSpec extends LaravelObjectBehavior
{
    function let()
    {
        $this->beConstructedWith(new RandomClass());
    }

    function it_is_initializable()
    {
        $this->shouldHaveType(RandomGenerator::class);
    }

    function it_should_return_table_name_of_model()
    {
        $this->getModelTableName()->shouldEqual('random_table');
    }

    function it_should_return_model()
    {
        $this->getModel()->shouldBeAnInstanceOf(RandomClass::class);
    }

    function it_should_return_table_column_as_array()
    {
        $this->getTableColumns()->shouldBeArray();
    }
}
```

## 5. Run PHPSpec test

```bash
./vendor/bin/phpspec run
```
