import os
import boto3
from botocore.client import Config

# Cloudflare se mile hue credentials
access_key = '6c8a64a649f2151e5f83b7a276f00580'
secret_key = '062b3b654a376b3c63a7fc977105c739f0d3ff0fb466180323335c0863810771'
endpoint_url = 'https://a17efb228292b39080bc2c4f11376405.r2.cloudflarestorage.com'
bucket_name = 'product-images' #

# S3 Client setup (R2 is S3 compatible)
s3 = boto3.client('s3',
    endpoint_url=endpoint_url,
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
    config=Config(signature_version='s3v4')
)

# Aapke computer ka folder jaha saari images hain
local_folder = 'D:/website final dfpl/FASTENER/all_images'

for filename in os.listdir(local_folder):
    if filename.endswith(('.png', '.jpg', '.jpeg', '.webp')):
        file_path = os.path.join(local_folder, filename)
        # Direct root mein upload (No folders)
        s3.upload_file(file_path, bucket_name, filename)
        print(f"✅ Uploaded: {filename}")