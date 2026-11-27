import mongoose,{Schema} from 'mongoose';
const schema=new Schema({slug:{type:String,required:true,unique:true},name:{type:String,required:true},developer:{type:String,required:true},city:{type:String,required:true},district:{type:String,required:true},summary:{type:String,required:true},stage:{type:String,enum:['announced','under-construction','completed'],required:true},sourceUrl:{type:String,required:true},sourceDate:{type:Date,required:true},status:{type:String,enum:['draft','published'],default:'draft'},publishedAt:Date,editor:{type:Schema.Types.ObjectId,ref:'User'}},{timestamps:true});
schema.index({status:1,updatedAt:-1});
export default mongoose.models.Development||mongoose.model('Development',schema);
