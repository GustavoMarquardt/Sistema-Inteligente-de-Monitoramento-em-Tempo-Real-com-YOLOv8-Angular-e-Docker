const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UsuarioDesktop = sequelize.define('UsuarioDesktop', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        login: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        senha: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        academiaID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Academia', // Nome da tabela associada ao modelo Academia
                key: 'id',
            },
        },
        nivelAcesso: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                isIn: [[1, 2, 3]], // Exemplo de validação de nível de acesso (1: admin, 2: gerente, 3: usuário)
            },
        },
    }, {
        timestamps: false, // Desabilita os campos createdAt e updatedAt
    });

    // Funções para manipulação de usuários
    UsuarioDesktop.cadastrar_usuario = async (usuario) => {
        try {
            const novoUsuario = await UsuarioDesktop.create(usuario);
            return { status: 200, mensagem: 'Usuário cadastrado com sucesso!', usuario: novoUsuario };
        } catch (error) {
            console.error('Erro ao cadastrar usuário:', error);
            return { status: 500, mensagem: 'Erro ao cadastrar usuário' };
        }
    };

    UsuarioDesktop.listar_usuarios = async () => {
        try {
            const usuarios = await UsuarioDesktop.findAll();
            return { status: 200, usuarios };
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            return { status: 500, mensagem: 'Erro ao listar usuários' };
        }
    };

    UsuarioDesktop.atualizar_usuario = async (usuario) => {
        try {
            const updatedUsuario = await UsuarioDesktop.update(usuario, { where: { id: usuario.id } });
            return { status: 200, updatedUsuario };
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            return { status: 500, mensagem: 'Erro ao atualizar usuário' };
        }
    };

    UsuarioDesktop.excluir_usuario = async (id) => {
        try {
            const deletedUsuario = await UsuarioDesktop.destroy({ where: { id } });
            return { status: 200, mensagem: 'Usuário excluído com sucesso!' };
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            return { status: 500, mensagem: 'Erro ao excluir usuário' };
        }
    };

    return UsuarioDesktop;
};
