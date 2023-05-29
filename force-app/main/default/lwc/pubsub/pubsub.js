const events = {};

/**
 * Registers a callback for an event
 * @param {string} eventName - Name of the event to listen for.
 * @param {function} callback - Function to invoke when said event is fired.
 */
const registerListener = (eventName, callback) => {

  if (!events[eventName]) {
    events[eventName] = [];
  }
  const duplicate = events[eventName].find((listener) => {
    return listener.callback === callback
  });
  if (!duplicate) {
    events[eventName].push({ callback });
  }
};

/**
 * Unregisters a callback for an event
 * @param {string} eventName - Name of the event to unregister from.
 * @param {function} callback - Function to unregister.
 */
const unregisterListener = (eventName, callback) => {
  if (events[eventName]) {
    events[eventName] = events[eventName].filter(
      (listener) =>
        listener.callback !== callback
    );
  }
};


/**
 * Fires an event to listeners.
 * @param {string} eventName - Name of the event to fire.
 * @param {*} payload - Payload of the event to fire.
 */
const fireEvent = (eventName, payload) => {
  if (events[eventName]) {
    const listeners = events[eventName];
    listeners.forEach((listener) => {
      try {
        listener.callback(payload);
      } catch (error) {
        // fail silently
        console.log('event error', error)
      }
    });
  }
};

export {
  registerListener,
  unregisterListener,
  fireEvent
};
