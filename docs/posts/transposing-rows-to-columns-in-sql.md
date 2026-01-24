---
layout: BookLayout
title: "Transposing Rows to Columns in SQL"
date: 2023-01-25T02:52:06.695Z
---

# Transposing Rows to Columns in SQL

![SQL Transpose](/images/posts/sql-transpose-cover.png)

Sometimes, you may want to pivot data in a SQL table so that rows become columns and vice versa. This can be useful for creating reports or visualizations that compare data across different categories.

One way to do this in SQL is by using a database `view`, `GROUP BY` clause, and `HAVING` clause. Let's take a look at an example of how this can be done.

```sql
SELECT * FROM post_meta;

+---------+-------------+------------+
| post_id |  meta_key   | meta_value |
+---------+-------------+------------+
|      1  | first_name  | bikram     |
|      1  | last_name   | tuladhar   |
|      1  | status      | draft      |
|      1  | created_at  | 2023-02-01 |
+---------+-------------+------------+
```

Consider the following SQL statement:

```sql
CREATE OR REPLACE VIEW post_meta_simplified AS
SELECT post_id,
       MAX(IF(meta_key = 'first_name', meta_value, NULL)) AS first_name,
       MAX(IF(meta_key = 'last_name', meta_value, NULL)) AS last_name,
       MAX(IF(meta_key = 'status', meta_value, NULL)) AS status,
       MAX(IF(meta_key = 'created_at', meta_value, NULL)) AS created_at
FROM post_meta
GROUP BY post_id
HAVING CAST(created_at AS DATE) > CAST('2023-01-01' AS DATE)
       AND status = 'draft';
```

This SQL statement creates a view called `post_meta_simplified` which displays various pieces of metadata (stored in the `post_meta` table) for posts that meet certain criteria. The criteria are:

* The date created is after January 1st, 2023
* The status is "draft"

The view is created using a SELECT statement with a `GROUP BY` clause and a series of `MAX()` functions with `IF()` statements inside. The `IF()` statements check the value of the `meta_key` column and return the corresponding value in the `meta_value` column if it matches the given key. If there is no match, it returns NULL. The `MAX()` function is used to return the `meta_value` for the row with the matching `meta_key` (there may be multiple rows for each `post_id` with different `meta_key`/`meta_value` pairs).

The view also includes a `HAVING` clause which filters the view to only include rows where the `date_created` is after January 1st, 2023 and the `Status` is "draft".

For example, the following SELECT statement transposes the `first_name`, `last_name`, `created_at` and `status` columns:

```sql
SELECT *
FROM post_meta_simplified WHERE post_id = 1;

+---------+------------+-----------+---------+------------+
| post_id | first_name | last_name | status  | created_at |
+---------+------------+-----------+---------+------------+
|      1  | bikram     | tuladhar  | draft   | 2023-02-01 |
+---------+------------+-----------+---------+------------+
```

This will return a table with one row for each `post_id` in the `post_meta_simplified` view, with the `first_name`, `last_name`, `created_at` and `status` values transposed as columns.

Using a database view, `GROUP BY` clause, and `HAVING` clause can be a powerful way to transpose rows to columns in SQL and filter the resulting data based on specific criteria. It can be particularly useful when working with large and complex datasets where you need to extract specific pieces of information and present them in a more easily digestible format.
