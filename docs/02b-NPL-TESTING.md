# 02b - NPL Unit Testing Guide

## Overview

This guide covers creating NPL unit tests to validate protocol logic.

## Test File Organization

```
npl/src/test/npl/yourpackage/YourProtocolTests.npl
```

## Test Syntax

```npl
package yourpackage

@test
function test_example(test: Test) -> {
    var protocol = YourProtocol['party1', 'party2'](param1);
    test.assertEquals(expected, protocol.field, "message");
};
```

## Assertions

- `test.assertEquals(expected, actual, message)`
- `test.assertFails(function() -> ..., message)`
- `test.assertTrue(condition, message)`
- `test.assertFalse(condition, message)`

## Running Tests

```bash
cd npl && mvn test
```
