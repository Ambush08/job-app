import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
    cloud_name: 'glvoqumd', 
    api_key: '744239236251454', 
    api_secret: '<your_api_secret>' 
});

export default cloudinary;