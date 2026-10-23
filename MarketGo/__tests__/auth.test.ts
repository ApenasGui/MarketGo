import { loginSchema, registerSchema } from '@/schemas/auth';

const valid = {
  name: 'Ana Silva',
  email: 'ana@example.com',
  password: 'segredo123',
  confirm: 'segredo123',
};

test('cadastro recusa senha curta e informa o motivo no campo correto', () => {
  const result = registerSchema.safeParse({ ...valid, password: '123', confirm: '123' });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['password'],
          message: 'Use pelo menos 6 caracteres',
        }),
      ]),
    );
  }
});
test('cadastro exige confirmação igual à senha', () => {
  const result = registerSchema.safeParse({ ...valid, confirm: 'outra senha' });
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.issues[0].path).toEqual(['confirm']);
});
test('cadastro e login validam e-mail e removem espaços nas extremidades', () => {
  expect(
    registerSchema.parse({ ...valid, name: ' Ana Silva ', email: ' ana@example.com ' }),
  ).toMatchObject({ name: 'Ana Silva', email: 'ana@example.com' });
  expect(
    loginSchema.safeParse({ email: 'email inválido', password: 'abc' }).success,
  ).toBe(false);
  expect(loginSchema.safeParse({ email: valid.email, password: '' }).success).toBe(false);
});
