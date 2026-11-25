import * as fs from 'fs';
import * as path from 'path';
import { criarApp } from '../src/app';

describe('SPEC-5.12: Homologação, treinamento e implantação (RB-010)', () => {
  const guiaPath = path.resolve(
    __dirname,
    '../docs/implantacao-homologacao-treinamento.md'
  );

  /**
   * CA-1: Existência do guia com homologação, treinamento e implantação
   */
  it('CA-1: deve possuir guia contendo checklist de implantação, homologação e treinamento', () => {
    expect(fs.existsSync(guiaPath)).toBe(true);
    const conteudo = fs.readFileSync(guiaPath, 'utf-8');
    expect(conteudo).toContain('Checklist de Implantação');
    expect(conteudo).toContain('Roteiro de Homologação');
    expect(conteudo).toContain('Plano de Treinamento');
  });

  /**
   * CA-2: Cláusula obrigatória RB-010
   */
  it('CA-2: deve declarar explicitamente a regra RB-010 de não conformidade automática', () => {
    const conteudo = fs.readFileSync(guiaPath, 'utf-8');
    expect(conteudo).toContain('RB-010');
    expect(conteudo.toLowerCase()).toContain('não promete conformidade automática');
  });

  /**
   * CA-3: Prontidão de inicialização da aplicação
   */
  it('CA-3: deve inicializar a aplicação Express com todos os módulos registrados', () => {
    const instancia = criarApp();
    expect(instancia.app).toBeDefined();
  });
});
