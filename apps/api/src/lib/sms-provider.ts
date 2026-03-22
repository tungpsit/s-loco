export interface SMSProvider {
  send(phone: string, message: string): Promise<boolean>
}

export class ConsoleSMSProvider implements SMSProvider {
  async send(phone: string, message: string) {
    console.log(`\n╔════════════════════════════════════╗`)
    console.log(`║  [SMS] To: ${phone.padEnd(16)}   ║`)
    console.log(`║  ${message.padEnd(32)} ║`)
    console.log(`╚════════════════════════════════════╝\n`)
    return true
  }
}
