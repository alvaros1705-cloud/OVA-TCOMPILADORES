class CompilerError(Exception):
    def __init__(self, message: str, position=None):
        self.message = message
        self.position = position
        super().__init__(message)

    def __str__(self):
        if self.position:
            return f"[{self.position}] {self.message}"
        return self.message
