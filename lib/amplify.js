import { Amplify } from 'aws-amplify'

Amplify.configure({
  Auth: {
    region: 'tu-region',
    userPoolId: 'tu-user-pool-id',
    userPoolWebClientId: 'tu-client-id'
  },
  Storage: {
    region: 'tu-region',
    bucket: 'tu-bucket',
    identityPoolId: 'tu-identity-pool-id'
  }
}) 