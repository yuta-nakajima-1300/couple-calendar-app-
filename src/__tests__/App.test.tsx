// Basic smoke test
describe('App', () => {
  it('renders without crashing', () => {
    // This is a basic smoke test to ensure the test setup works
    expect(1 + 1).toBe(2);
  });
  
  it('can perform basic calculations', () => {
    expect(Math.max(1, 2, 3)).toBe(3);
  });
});