import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import Component from './Component.vue';

// IMPLEMENTATION_TESTING: Testing internal implementation
describe('Component Implementation Tests', () => {
  it('tests internal state directly', () => {
    const wrapper = mount(Component);

    // Bad: Testing internal implementation
    expect(wrapper.vm.counter).toBe(0);
    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.internalMethod).toHaveBeenCalled();

    // Bad: Using setData to manipulate internal state
    wrapper.setData({ counter: 5 });
    expect(wrapper.vm.counter).toBe(5);
  });

  it('tests private methods', () => {
    const wrapper = mount(Component);

    // Bad: Testing private/internal methods
    const privateMethod = wrapper.vm.privateValidation;
    expect(privateMethod('test')).toBe(true);
  });
});

// PINIA_STATE_LEAK: Not using proper test isolation
describe('Store Tests Without Isolation', () => {
  // Missing beforeEach with setActivePinia
  it('uses store without isolation', () => {
    const pinia = createTestingPinia();
    // Missing: setActivePinia(pinia);

    const wrapper = mount(Component, {
      global: {
        plugins: [pinia]
      }
    });

    // Test that might be affected by other tests
    expect(wrapper.exists()).toBe(true);
  });

  it('another test that shares state', () => {
    // This test might be affected by the previous test's state
    const wrapper = mount(Component);
    expect(wrapper.exists()).toBe(true);
  });
});

// SNAPSHOT_OVERUSE: Excessive snapshot testing
describe('Snapshot Heavy Tests', () => {
  it('matches snapshot for entire component', () => {
    const wrapper = mount(Component);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('matches snapshot for different state', () => {
    const wrapper = mount(Component, {
      props: { variant: 'primary' }
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('matches snapshot for loading state', () => {
    const wrapper = mount(Component);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('matches snapshot for error state', () => {
    const wrapper = mount(Component);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('matches snapshot for mobile view', () => {
    // Mock window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    const wrapper = mount(Component);
    expect(wrapper.html()).toMatchSnapshot();
  });
});