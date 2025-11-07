let counter = 0

module.exports = {
  customAlphabet: (alphabet, size) => {
    return () => {
      counter++
      const chars = alphabet.split("")
      let result = ""
      for (let i = 0; i < size; i++) {
        result += chars[Math.floor(Math.random() * chars.length)]
      }
      return result
    }
  },
  nanoid: () => {
    counter++
    return (
      "test_nanoid_" + counter + "_" + Math.random().toString(36).substring(7)
    )
  },
}
