<?php

function foo(string $foo): bool
{
    return $foo === 'foo';
}

var_dump(
    foo('foo'), // bool(true)
    foo('bar'), // bool(false)
);
