---
layout: BookLayout
title: "Backend Knowledge Sharing #4"
date: 2019-06-19T00:00:00.000Z
---

# Backend Knowledge Sharing #4

Collaborating to share knowledge about backend technologies.

![Backend Knowledge Sharing](https://cdn-images-1.medium.com/max/2560/1*UuZpqhUZ515u_pyjsX-zKg.png)

## Table of Contents

1. [PostgreSQL JSON Operators & Functions](#postgresql-json-operators--functions)
2. [Provide/Inject in Vue.js](#provideinject-in-vuejs)

---

## PostgreSQL JSON Operators & Functions

Working with the database can be fun when you can manipulate data as you wish. Akita Nakarmi shared Postgres JSON and JSONB operators and functions to rescue developers from tedious and complex work for easier data manipulation within the database level.

PostgreSQL offers a binary representation of JSON data, `jsonb` since version 9.4. The data types `json` and `jsonb` are somewhat similar, the main difference between them is that `json` data is stored as an exact copy of the JSON input text, whereas `jsonb` stores data in a decomposed binary form. It gives a significant speedup to increase performance.

To know more about the `jsonb` data type, refer to this [link](https://www.compose.com/articles/faster-operations-with-the-jsonb-data-type-in-postgresql/).

We will be using the table below for our examples of operators and functions.

```
Table Name: users

name    | districts               | metadata
--------+-------------------------+--------------------------
Harry   | ["bajhang","kailali"]   | {"age":23,"gender":"male"}
Rahul   | ["lalitpur"]            | {"age":20,"gender":"male"}
Radhika | ["bhaktapur","achham"]  | {"age":28,"gender":"female"}
```

### Operators ('?', '?|', '?&')

`?` operator checks if the given string is present as the top-level key in the JSON value.

```sql
where '{"Bhaktapur", "lalitpur","aacham}'::jsonb ? 'lalitpur'
```

`?|` operator checks if the given array strings exist as top-level keys.

```sql
where '{"Bhaktapur", "lalitpur","aacham}'::jsonb ?| array ['lalitpur','kathamdu']
```

`?&` operator checks if all of these array strings exist as top-level keys.

```sql
where '{"Bhaktapur", "lalitpur","aacham"}'::jsonb ?& array ['lalitpur','aacham']
```

### Functions

**1. json_array_elements()**

This function expands a JSON array to a set of JSON values.

```sql
select json_array_elements(users.districts) as district from users
```

Output:

```
district
-----------
"bajhang"
"kailali"
"lalitpur"
"bhaktapur"
"aacham"
```

**2. jsonb_exists_any()**

This function checks if the given value exists in the JSON data.

```sql
select name,districts from users where jsonb_exists_any(districts::jsonb, array['achham'])
```

Output:

```
name    | districts
--------+----------------------
Radhika | ["bhaktapur","achham"]
```

**3. json_each()**

This function expands the JSON object into a set of key/value pairs.

```sql
select name, detail.key, detail.value from users, json_each(users.metadata) As detail;
```

Output:

```
name    | key    | value
--------+--------+--------
Harry   | age    | 23
Harry   | gender | "male"
Rahul   | age    | 20
Rahul   | gender | "male"
Radhika | age    | 28
Radhika | gender | "female"
```

**4. json_object_keys()**

This function returns set of keys in the JSON object.

```sql
select name, key from users, json_object_keys(users.metadata) As key;
```

Output:

```
name    | key
--------+-------
Harry   | age
Harry   | gender
Rahul   | age
Rahul   | gender
Radhika | age
Radhika | gender
```

**5. json_build_object()**

This function builds a JSON object out of an argument list.

```sql
select * from json_build_object('age', 19, 'gender', 'female') As metadata
```

Output:

```
metadata
----------------------------
{"age":19,"gender":"female"}
```

For more reference visit the [PostgreSQL docs](https://www.postgresql.org/docs/9.5/functions-json.html).

---

## Provide/Inject in Vue.js

We started using Vue.js to build complex UI in our Laravel projects a while back. As a project grows bigger and complex any framework is bound to get messy. Sandip Shrestha shared his experience of dependency injection in Vue which makes data transfer from parent to its descendant components like a cool breeze on a hot summer day.

Provide and Inject are used together to allow an ancestor component to serve as a dependency injector for all its descendants, regardless of how deep the component hierarchy is, as long as they are in the same parent chain.

*(For example, A parent component can inject validation messages in input components.)*

### Example

```javascript
// parent component providing 'menuOptions'
var ParentComponent = {
    data() {
        return {
            menu: ['Home', 'About', 'Contact'],
        }
    },
    provide: {
        menuOptions: this.menu
    },
    // ...
}

// child component injecting 'menuOptions'
var ChildComponent = {
    inject: ['menuOptions'],
    created() {
        console.log(this.menuOptions)
        // output => ['Home', 'About', 'Contact']
    }
    // ...
}
```

You can also provide and inject a function.

```javascript
var ParentComponent = {
    data() {
        return {
            menu: ['Home', 'About', 'Contact'],
        }
    },

    methods: {
        getMenu: function() {
            return this.menu;
        },
        setMenu: function(data) {
            this.menu = data;
        },
    },

    provide: function() {
        return {
            getMenu: this.getMenu,
            setMenu: this.setMenu
        }
    },
}

var ChildComponent = {
    inject: ["getMenu", "setMenu"],

    computed: {
        menu: {
            get: function() {
                return this.getMenu()
            },
            set: function(d) {
                this.setMenu(d)
            },
        }
    },
}
```

> Note: the `provide` and `inject` bindings are NOT reactive. This is intentional. However, if you pass down an observed object, properties on that object do remain reactive.

```javascript
var ParentComponent = {
    provide() {
        const menu = {}

        Object.defineProperty(menu, 'menuOptions', {
            enumerable: true,
            get: () => this.menuOptions,
        })

        return { menu }
    },

    data: () => ({ menuOptions: ['Home', 'About', 'Contact'] }),
}

var ChildComponent = {
    inject: ['menu'],

    template: `<ul id="example">
                 <li v-for="item in menu">
                   {{ item }}
                 </li>
               </ul>`,
}
```

Injections are available in `props` and `data`. So, you could set injected data as `prop` defaults or you can use injections as an initial value of `data`.

More on provide/inject on the [official documentation](https://vuejs.org/v2/api/#provide-inject).

---

Interested? You can read our previous blog: [Backend Knowledge Sharing #3](https://blog.yipl.com.np/backend-knowledge-sharing-3-a63e555574c5)
