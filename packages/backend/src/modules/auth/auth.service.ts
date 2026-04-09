import { prisma } from '../../db/prisma.js'
import { verificarSenha } from '../../utils/hash.js'

export const authService = {
  async autenticar(username: string, senha: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        senha_hash: true,
        nome_display: true,
        ativo: true,
      },
    })

    if (!usuario) {
      return { sucesso: false as const, motivo: 'credenciais_invalidas' as const }
    }

    if (!usuario.ativo) {
      return { sucesso: false as const, motivo: 'usuario_inativo' as const }
    }

    const senhaCorreta = await verificarSenha(senha, usuario.senha_hash)
    if (!senhaCorreta) {
      return { sucesso: false as const, motivo: 'credenciais_invalidas' as const }
    }

    return {
      sucesso: true as const,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        nome_display: usuario.nome_display,
      },
    }
  },
}
