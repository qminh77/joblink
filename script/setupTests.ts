import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock server-only to prevent vitest from throwing errors when testing Next.js server actions
vi.mock('server-only', () => ({}));
