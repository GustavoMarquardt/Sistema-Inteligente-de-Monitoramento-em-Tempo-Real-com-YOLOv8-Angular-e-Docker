const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Historico_uso_equipamento = sequelize.define('Historico_uso_equipamento', {
      id_equipamento: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Equipamentos', // Nome da tabela do modelo Equipamento
          key: 'id', // Chave que vai referenciar
        },
      },
      data_inicio_uso: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      data_fim_uso: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    }, {
        timestamps: false, // Desabilita os campos createdAt e updatedAt
      })
    ;
  
    // Aqui definimos as associações corretamente
    Historico_uso_equipamento.associate = (models) => {
      Historico_uso_equipamento.belongsTo(models.Equipamento, {
        foreignKey: 'id_equipamento',
        as: 'equipamento',
      });
    };

    // Funções CRUD

    Historico_uso_equipamento.cadastrarHistorico = async (dados) => {
        try {
            const novoHistorico = await Historico_uso_equipamento.create(dados);
            return {
                status: 200,
                mensagem: "Historico cadastrado com sucesso!",
                historico: novoHistorico
            };
        } catch (error) {
            return {
                status: 500,
                mensagem: "Erro ao cadastrar historico",
                error: error.message
            };
        }
    }

    Historico_uso_equipamento.listarHistorico = async () => {
        try {
            const historico = await Historico_uso_equipamento.findAll();
            return {
                status: 200,
                historico
            };
        } catch (error) {
            return {
                status: 500,
                mensagem: error.message
            };
        }
    }

    Historico_uso_equipamento.atualizarHistorico = async (historico) => {
        try {
            const updatedHistorico = await Historico_uso_equipamento.update(historico, { where: { id: historico.id } });
            return {
                status: 200,
                updatedHistorico
            };
        } catch (error) {
            return {
                status: 500,
                mensagem: error.message
            };
        }
    }

    Historico_uso_equipamento.excluirHistorico = async (id) => {
        try {
            const deletedHistorico = await Historico_uso_equipamento.destroy({ where: { id } });
            return {
                status: 200,
                mensagem: "Historico excluído com sucesso!"
            };
        } catch (error) {
            return {
                status: 500,
                mensagem: error.message
            };

        }
    }

    // funções futuras...
    return Historico_uso_equipamento; // Retorna o modelo definido
};
