module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: './tsconfig.test.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  // Alias de chemin cohérent avec tsconfig.json
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
