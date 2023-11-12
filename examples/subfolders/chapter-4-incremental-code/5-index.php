<?php

function foo(string $foo): bool
{
    return $foo === 'foo';
}

var_dump(
    foo('foo'),
    foo('bar'),
);
