// O módulo nativo do AsyncStorage não existe no Jest; usamos o mock oficial da biblioteca.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
