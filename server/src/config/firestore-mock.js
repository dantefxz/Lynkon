/**
 * Mock Firestore para desarrollo cuando la API no está disponible
 * Almacena los datos en memoria
 */

const mockData = {
  users: {},
};

function makeDocSnapshot(name, id) {
  const value = mockData[name]?.[id];
  return { exists: !!value, data: () => value };
}

const createMockFirestore = () => {
  return {
    collection: (name) => ({
      doc: (id) => ({
        set: async (data) => {
          if (!mockData[name]) mockData[name] = {};
          mockData[name][id] = { ...data, id };
          console.log(`✅ Mock Firestore: Guardado ${name}/${id}`);
        },
        get: async () => makeDocSnapshot(name, id),
      }),
      where: () => ({
        get: async () => ({ docs: [] }),
      }),
      get: async () => ({ docs: [] }),
    }),
  };
};

module.exports = { createMockFirestore, mockData };
