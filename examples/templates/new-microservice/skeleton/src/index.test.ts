import { describe, it, expect } from 'vitest';

describe('${{ values.name }}', () => {
  it('has a service name', () => {
    expect('${{ values.name }}').toBeTruthy();
  });
});
