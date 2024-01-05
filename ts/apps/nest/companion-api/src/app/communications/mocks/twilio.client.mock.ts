beforeEach(() => {
  mockExecutionListInstance.create.mockClear();
  mockStudio.v2.flows.mockClear();
});

export const mockExecutionListInstance = {
  create: jest.fn(),
};
export const mockFlowContext = {
  executions: mockExecutionListInstance,
};

const mockStudio = {
  v2: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    flows: jest.fn((_: string) => mockFlowContext),
  },
};

export const mockTwilioService = {
  client: { studio: mockStudio },
};
