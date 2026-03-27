import re

with open('src/server/elo-transaction.ts', 'r') as f:
    content = f.read()

# 1. Remove the Client union type
content = content.replace(
    "type Client = PrismaClient | Prisma.TransactionClient;\n\nexport interface EloGameInput {",
    "export interface EloGameInput {"
)


# 2. Update createGameWithEloUpdate signature
content = content.replace(
    "export async function createGameWithEloUpdate(input: GameInput, client: Client = prisma) {",
    "export async function createGameWithEloUpdate(input: GameInput, client: PrismaClient = prisma) {"
)

# 3. Update updateEloForExistingGame signature
content = content.replace(
    "export async function updateEloForExistingGame(input: EloGameInput, client: Client = prisma) {",
    "export async function updateEloForExistingGame(input: EloGameInput, client: PrismaClient = prisma) {"
)


with open('src/server/elo-transaction.ts', 'w') as f:
    f.write(content)

print("Done")
