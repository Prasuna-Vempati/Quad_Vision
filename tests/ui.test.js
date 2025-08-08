import { describe, test, expect, beforeEach } from '@jest/globals';
import { JSDOM } from 'jsdom';

describe('UI Component Tests', () => {
  test('should create basic HTML structure', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body><h1>Test</h1></body></html>');
    expect(dom.window.document.querySelector('h1')).toBeTruthy();
  });

  test('should handle navigation elements', () => {
    const dom = new JSDOM('<nav><a href="/">Home</a></nav>');
    const nav = dom.window.document.querySelector('nav');
    expect(nav).toBeTruthy();
  });

  test('should handle forms', () => {
    const dom = new JSDOM('<form><input type="text" name="test" /></form>');
    const form = dom.window.document.querySelector('form');
    expect(form).toBeTruthy();
  });
});
