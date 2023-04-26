const verifier = require('pact').Verifier
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
chai.use(chaiAsPromised)
const {
  server,
  importData,
  animalRepository
} = require('../provider.js')

// Append some extra endpoints to mutate current state of the API
server.get('/states', (req, res) => {
  res.json({
    "Matching Service": ['Has some animals', 'Has no animals', 'Has an animal with ID 1']
  })
})

server.post('/setup', (req, res) => {
  const state = req.body.state

  animalRepository.clear()
  switch (state) {
    case 'Has no animals':
      // do nothing
      break
    default:
      importData()
  }

  res.end()
})

server.listen(8081, () => {
  console.log('Animal Profile Service listening on http://localhost:8081')
})

// Verify that the provider meets all consumer expectations
describe('Pact Verification', () => {
  it('should validate the expectations of Matching Service', function() { // lexical binding required here
    this.timeout(10000)

    let opts = {
      providerBaseUrl: 'http://localhost:8081',
      providerStatesUrl: 'http://localhost:8081/states',
      providerStatesSetupUrl: 'http://localhost:8081/setup',
      // Remote pacts
      // pactUrls: ['https://test.pact.dius.com.au/pacts/provider/Animal%20Profile%20Service/consumer/Matching%20Service/latest'],
      // Local pacts
      pactUrls: [path.resolve(process.cwd(), './pacts/matching_service-animal_profile_service.json')],
      pactBrokerUsername: 'dXfltyFMgNOFZAxr8io9wJ37iUpY42M',
      pactBrokerPassword: 'O5AIZWxelWbLvqMd8PkAVycBJh2Psyg1'
    }

    return verifier.verifyProvider(opts)
      .then(output => {
        console.log('Pact Verification Complete!')
        console.log(output)
      })
  })
})
