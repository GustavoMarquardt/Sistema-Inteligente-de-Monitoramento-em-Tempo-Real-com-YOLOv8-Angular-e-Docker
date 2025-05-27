const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Historico_lotacao = sequelize.define('Historico_lotacao', {
    quantidade_pessoas: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    timestamps: false, // Desabilita os campos createdAt e updatedAt
  });

  // Aqui definimos as associações corretamente
  Historico_lotacao.associate = (models) => {
    // Associação com Academia
    Historico_lotacao.belongsTo(models.Academia, {
      foreignKey: 'idAcademia',
      as: 'academia',
    });
  };

  // Funções CRUD

  Historico_lotacao.cadastrarHistorico = async (dados) => {
    try {
      const novoHistorico = await Historico_lotacao.create(dados);
      return {
        status: 200,
        mensagem: "Histórico de lotação cadastrado com sucesso!",
        historico: novoHistorico,
      };
    } catch (error) {
      return {
        status: 500,
        mensagem: "Erro ao cadastrar histórico de lotação",
        error: error.message,
      };
    }
  };

  Historico_lotacao.listarHistorico = async () => {
    try {
      const historico = await Historico_lotacao.findAll();
      return {
        status: 200,
        historico,
      };
    } catch (error) {
      return {
        status: 500,
        mensagem: error.message,
      };
    }
  };

  Historico_lotacao.atualizarHistorico = async (historico) => {
    try {
      const updatedHistorico = await Historico_lotacao.update(historico, { where: { id: historico.id } });
      return {
        status: 200,
        updatedHistorico,
      };
    } catch (error) {
      return {
        status: 500,
        mensagem: error.message,
      };
    }
  };

  Historico_lotacao.excluirHistorico = async (id) => {
    try {
      const deletedHistorico = await Historico_lotacao.destroy({ where: { id } });
      return {
        status: 200,
        mensagem: "Histórico de lotação excluído com sucesso!",
      };
    } catch (error) {
      return {
        status: 500,
        mensagem: error.message,
      };
    }
  };

  // funções futuras...
  return Historico_lotacao; // Retorna o modelo definido
};
