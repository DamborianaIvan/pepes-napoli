// models/ConfiguracionGlobal.js
import mongoose from 'mongoose';

const StockGeneralSchema = new mongoose.Schema({
  stockGeneralActivo: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.model('StockGeneral', StockGeneralSchema);
