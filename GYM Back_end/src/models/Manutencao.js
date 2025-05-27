const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  // Definição do modelo Manutencao
  const Manutencao = sequelize.define(
    "Manutencao",
    {
      id_equipamento: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Equipamentos", // Nome do modelo relacionado
          key: "id", // Campo referenciado no modelo Equipamento
        },
      },
      data_inicio_manutencao: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      data_fim_manutencao: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      ultima_manutencao: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      descricao: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      custo_manutencao: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: false, // Desabilita os campos createdAt e updatedAt
    }
  );

  // Definindo associações
  Manutencao.associate = (models) => {
    Manutencao.belongsTo(models.Equipamento, {
      foreignKey: "id_equipamento",
      as: "equipamento",
    });
  };

  // Funções CRUD
  Manutencao.cadastrarManutencao = async (dados) => {
    try {
      const novaManutencao = await Manutencao.create(dados);
      return {
        status: 200,
        mensagem: "Manutenção cadastrada com sucesso!",
        manutencao: novaManutencao,
      };
    } catch (error) {
      console.error("Erro ao cadastrar manutenção:", error);
      return { status: 500, mensagem: "Erro ao cadastrar manutenção" };
    }
  };

  Manutencao.listarManutencoes = async () => {
    try {
      const manutencoes = await Manutencao.findAll();
      return { status: 200, manutencoes };
    } catch (error) {
      return { status: 500, mensagem: error.message };
    }
  };

  Manutencao.atualizarManutencao = async (dados) => {
    try {
      const atualizado = await Manutencao.update(dados, {
        where: { id: dados.id },
      });
      return { status: 200, atualizado };
    } catch (error) {
      return { status: 500, mensagem: error.message };
    }
  };

  Manutencao.excluirManutencao = async (id) => {
    try {
      await Manutencao.destroy({ where: { id } });
      return { status: 200, mensagem: "Manutenção excluída com sucesso!" };
    } catch (error) {
      return { status: 500, mensagem: error.message };
    }
  };

  return Manutencao;
};
