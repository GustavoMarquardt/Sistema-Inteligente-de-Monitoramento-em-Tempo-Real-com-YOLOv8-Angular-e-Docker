const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Academia = sequelize.define('Academia', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            validate: {
                isNonZero(value) {
                    if (value === 0) {
                        throw new Error('O id não pode ser 0.');
                    }
                },
            },
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false
        },
        endereco: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ip_publico_academia: {
            type: DataTypes.STRING,
            allowNull: false
        },
        port: {
            type: DataTypes.STRING,
            allowNull: false
        },
        width: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        height: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        altura: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        numeroTelefone: {
            type: DataTypes.STRING,
            allowNull: false
        },
    }, {
        timestamps: false, // Desabilita os campos createdAt e updatedAt
    });

    // Funções para manipulação de academias
    Academia.cadastrar_academia = async (academia) => {
        try {
            const novaAcademia = await Academia.create(academia);
            return { status: 200, mensagem: 'Academia cadastrada com sucesso!', academia: novaAcademia };
        } catch (error) {
            console.error('Erro ao cadastrar academia:', error);
            return { status: 500, mensagem: 'Erro ao cadastrar academia' };
        }
    };

    Academia.listar_academias = async () => {
        try {
            const academias = await Academia.findAll();
            return { status: 200, academias };
        } catch (error) {
            return { status: 500, message: error.message };
        }
    };

    Academia.atualizar_academia = async (academia) => {
        try {
            const updatedAcademia = await Academia.update(academia, { where: { id: academia.id } });
            return { status: 200, updatedAcademia };
        } catch (error) {
            return { status: 500, message: error.message };
        }
    };

    Academia.excluir_academia = async (id) => {
        try {
            const deletedAcademia = await Academia.destroy({ where: { id } });
            return { status: 200, message: 'Academia excluída com sucesso!' };
        } catch (error) {
            return { status: 500, message: error.message };
        }
    };

    return Academia;
};
