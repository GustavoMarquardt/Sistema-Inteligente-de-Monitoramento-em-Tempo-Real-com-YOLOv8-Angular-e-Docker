const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Rois = sequelize.define('Rois', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        cameraId: {
            type: DataTypes.INTEGER,
            allowNull: true, // Permite NULL ou altere para false se a relação for obrigatória
            references: {
                model: 'Cameras',
                key: 'id',
            },
        },
        idAparelho: {
            type: DataTypes.INTEGER,
            allowNull: true, // Permite NULL ou altere para false se a relação for obrigatória
            references: {
                model: 'Equipamentos',
                key: 'id',
            },
        },
        pontos: {
            type: DataTypes.JSON,
            allowNull: false,
            validate: {
                isValidROI(value) {
                    if (!Array.isArray(value) || value.length < 3) {
                        throw new Error('O ROI deve conter pelo menos três pontos.');
                    }
                },
            },
        },
    });

    return Rois;
};
