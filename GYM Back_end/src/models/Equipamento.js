const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Definição do modelo Equipamento
    const Equipamento = sequelize.define('Equipamento', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        nome_equipamento: {
            type: DataTypes.STRING,
            allowNull: false
        },
        cameraId: {
            type: DataTypes.INTEGER,
            defaultValue: -1, // Valor padrão
        },
        altura: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        largura: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        profundidade: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        x: {
            type: DataTypes.FLOAT,
            defaultValue: 0, // Valor padrão
        },
        y: {
            type: DataTypes.FLOAT,
            defaultValue: 0, // Valor padrão
        },
        isParede: {
            type: DataTypes.BOOLEAN,
            defaultValue: false, // Valor padrão
        },
        data_aquisicao: {
            type: DataTypes.DATE,
            allowNull: false
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        ocupado: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false, // Valor padrão definido como false
        },
        divisao: {
            type: DataTypes.STRING,
            allowNull: false
        },
        idAcademia: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "Academia", // Nome do modelo relacionado
                key: "id", // Campo referenciado no modelo Equipamento
            },
        },
    }, {
        timestamps: false, // Desabilita os campos createdAt e updatedAt
    });


    return Equipamento; // Retorna o modelo definido
};
