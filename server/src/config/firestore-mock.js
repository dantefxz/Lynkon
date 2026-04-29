/**
 * Mock Firestore para desarrollo cuando la API no está disponible
 * Almacena los datos en memoria
 */

const mockData = {
  users: {},
};

const createMockFirestore = () => {
  return {
    collection: (name) => ({
      doc: (id) => ({
        set: async (data) => {
          if (!mockData[name]) mockData[name] = {};
          mockData[name][id] = { ...data, id };
          console.log(`✅ Mock Firestore: Guardado ${name}/${id}`);
          return Promise.resolve();
        },
        get: async () => {
          const data = mockData[name]?.[id];
          return {
            exists: !!data,
            data: () => data,
          };
        },
      }),
      where: () => ({
        get: async () => ({ docs: [] }),
      }),
      get: async () => ({ docs: [] }),
    }),
  };
};

module.exports = { createMockFirestore, mockData };
