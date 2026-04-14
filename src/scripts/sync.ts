import { syncAllUsers } from '../lib/sync/orchestrator'

async function run() {
  console.log('--- SYNC JOB STARTED ---')
  try {
    await syncAllUsers()
    console.log('--- SYNC JOB COMPLETED SUCCESSFULLY ---')
  } catch (error) {
    console.error('--- SYNC JOB FAILED ---')
    console.error(error)
    process.exit(1)
  }
}

run()
