const controller = require('../controllers/llmController');

describe('llmController simpleParse fallback', () => {
  test('parses book intent with tickets and event', () => {
    const txt = 'Book 2 tickets for Concert A';
    const parsed = controller._simpleParse(txt);
    expect(parsed).toBeTruthy();
    expect(parsed.intent).toBe('book');
    expect(parsed.tickets).toBe(2);
    expect(parsed.event).toMatch(/Concert A/i);
  });

  test('parses list intent', () => {
    const parsed = controller._simpleParse('Show me concerts');
    expect(parsed).toBeTruthy();
    expect(parsed.intent).toBe('list');
  });

  test('returns null for unparseable text', () => {
    const parsed = controller._simpleParse('gibberish do something');
    expect(parsed).toBeNull();
  });
});
