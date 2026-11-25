// Generated from the survey and CSV fixtures in examples/ by generate_cases.py.
window.LimeControlDemoCases = {
  "fieldwork": {
    "title": {
      "pl": "Prace terenowe",
      "en": "Fieldwork"
    },
    "surveyId": 817301,
    "source": {
      "code": "CITIES",
      "title": {
        "pl": "Wybierz lokalizacje",
        "en": "Choose locations"
      },
      "fields": [
        {
          "path": [
            "LODZ"
          ],
          "label": {
            "pl": "Łódź",
            "en": "Łódź"
          },
          "fieldName": "817301X1X100LODZ",
          "value": "Y"
        },
        {
          "path": [
            "GDYNIA"
          ],
          "label": {
            "pl": "Gdynia",
            "en": "Gdynia"
          },
          "fieldName": "817301X1X100GDYNIA",
          "value": "Y"
        }
      ]
    },
    "questions": [
      {
        "code": "WORK",
        "title": {
          "pl": "Jakie prace wykonano?",
          "en": "Which tasks were performed?"
        },
        "definition": {
          "version": 1,
          "kind": "choice",
          "source": "CITIES",
          "options": [
            {
              "code": "MEASURE",
              "type": "multi",
              "label": {
                "pl": "Pomiar",
                "en": "Measurement",
                "de": "Messung"
              }
            },
            {
              "code": "SERVICE",
              "type": "multi",
              "label": {
                "pl": "Serwis",
                "en": "Service",
                "de": "Wartung"
              }
            }
          ],
          "rules": [],
          "revision": "572e3159713ef37a"
        }
      },
      {
        "code": "TIME",
        "title": {
          "pl": "Ile godzin zajęły prace?",
          "en": "How many hours did each task take?"
        },
        "definition": {
          "version": 1,
          "kind": "matrix",
          "source": "WORK",
          "options": [
            {
              "code": "HOURS",
              "type": "number",
              "label": {
                "pl": "Liczba godzin",
                "en": "Hours",
                "de": "Stunden"
              },
              "required": true
            }
          ],
          "rules": [],
          "revision": "1b8a8d89b5938517"
        }
      },
      {
        "code": "REASON",
        "title": {
          "pl": "Dlaczego prace trwały ponad osiem godzin?",
          "en": "Why did the task take more than eight hours?"
        },
        "definition": {
          "version": 1,
          "kind": "followup",
          "source": "TIME",
          "options": [
            {
              "code": "OTHER",
              "type": "multi",
              "label": {
                "pl": "Inne",
                "en": "Other",
                "de": "Sonstiges"
              },
              "comment": true
            }
          ],
          "rules": [
            {
              "effect": "show",
              "target": "*",
              "when": {
                "field": "source.HOURS",
                "op": "gt",
                "value": 8
              }
            }
          ],
          "revision": "db931e029c4606fd"
        }
      }
    ],
    "samples": {
      "pl": {
        "WORK": {
          "version": 1,
          "revision": "572e3159713ef37a",
          "rows": [
            {
              "path": [
                "LODZ"
              ],
              "cells": {
                "MEASURE": {
                  "value": true
                }
              }
            },
            {
              "path": [
                "GDYNIA"
              ],
              "cells": {
                "SERVICE": {
                  "value": true
                }
              }
            }
          ]
        },
        "TIME": {
          "version": 1,
          "revision": "1b8a8d89b5938517",
          "rows": [
            {
              "path": [
                "LODZ",
                "MEASURE"
              ],
              "cells": {
                "HOURS": {
                  "value": 9
                }
              }
            },
            {
              "path": [
                "GDYNIA",
                "SERVICE"
              ],
              "cells": {
                "HOURS": {
                  "value": 0
                }
              }
            }
          ]
        },
        "REASON": {
          "version": 1,
          "revision": "db931e029c4606fd",
          "rows": [
            {
              "path": [
                "LODZ",
                "MEASURE"
              ],
              "cells": {
                "OTHER": {
                  "value": true,
                  "comment": "Powtórzenie pomiaru"
                }
              }
            }
          ]
        }
      },
      "en": {
        "WORK": {
          "version": 1,
          "revision": "572e3159713ef37a",
          "rows": [
            {
              "path": [
                "LODZ"
              ],
              "cells": {
                "MEASURE": {
                  "value": true
                }
              }
            },
            {
              "path": [
                "GDYNIA"
              ],
              "cells": {
                "SERVICE": {
                  "value": true
                }
              }
            }
          ]
        },
        "TIME": {
          "version": 1,
          "revision": "1b8a8d89b5938517",
          "rows": [
            {
              "path": [
                "LODZ",
                "MEASURE"
              ],
              "cells": {
                "HOURS": {
                  "value": 9
                }
              }
            },
            {
              "path": [
                "GDYNIA",
                "SERVICE"
              ],
              "cells": {
                "HOURS": {
                  "value": 0
                }
              }
            }
          ]
        },
        "REASON": {
          "version": 1,
          "revision": "db931e029c4606fd",
          "rows": [
            {
              "path": [
                "LODZ",
                "MEASURE"
              ],
              "cells": {
                "OTHER": {
                  "value": true,
                  "comment": "Repeat measurement"
                }
              }
            }
          ]
        }
      }
    }
  },
  "equipment": {
    "title": {
      "pl": "Gotowość sprzętu do zajęć",
      "en": "Equipment readiness for class"
    },
    "surveyId": 817304,
    "source": {
      "code": "PLACES",
      "title": {
        "pl": "W których miejscach przygotowujesz sprzęt?",
        "en": "Where are you preparing equipment?"
      },
      "fields": [
        {
          "path": [
            "LIBRARY"
          ],
          "label": {
            "pl": "Biblioteka",
            "en": "Library"
          },
          "fieldName": "817304X1X100LIBRARY",
          "value": "Y"
        },
        {
          "path": [
            "STUDIO"
          ],
          "label": {
            "pl": "Pracownia",
            "en": "Studio"
          },
          "fieldName": "817304X1X100STUDIO",
          "value": "Y"
        }
      ]
    },
    "questions": [
      {
        "code": "DEVICES",
        "title": {
          "pl": "Jakie urządzenia sprawdzasz w każdym miejscu?",
          "en": "Which devices are you checking at each location?"
        },
        "definition": {
          "version": 1,
          "kind": "choice",
          "source": "PLACES",
          "options": [
            {
              "code": "TABLET",
              "type": "multi",
              "label": {
                "pl": "Tablet",
                "en": "Tablet",
                "de": "Tablet"
              }
            },
            {
              "code": "CAMERA",
              "type": "multi",
              "label": {
                "pl": "Aparat",
                "en": "Camera",
                "de": "Kamera"
              }
            }
          ],
          "rules": [],
          "revision": "b8aa06253a550eaf"
        }
      },
      {
        "code": "CHARGE",
        "title": {
          "pl": "Jaki jest poziom naładowania każdego urządzenia?",
          "en": "What is the battery level of each device?"
        },
        "definition": {
          "version": 1,
          "kind": "matrix",
          "source": "DEVICES",
          "options": [
            {
              "code": "BATTERY",
              "type": "number",
              "label": {
                "pl": "Naładowanie (%)",
                "en": "Battery level (%)",
                "de": "Akkustand (%)"
              },
              "required": true,
              "min": 0,
              "max": 100
            }
          ],
          "rules": [],
          "revision": "3439516541d77259"
        }
      },
      {
        "code": "PLAN",
        "title": {
          "pl": "Zaplanuj działanie dla urządzeń z niskim poziomem baterii.",
          "en": "Plan an action for each device with a low battery."
        },
        "definition": {
          "version": 1,
          "kind": "followup",
          "source": "CHARGE",
          "options": [
            {
              "code": "ACTION",
              "type": "text",
              "label": {
                "pl": "Co zrobisz przed zajęciami?",
                "en": "What will you do before class?",
                "de": "Was werden Sie vor dem Unterricht tun?"
              },
              "required": true
            }
          ],
          "rules": [
            {
              "effect": "show",
              "target": "*",
              "when": {
                "field": "source.BATTERY",
                "op": "lte",
                "value": 20
              }
            }
          ],
          "revision": "6d82a30986433ce1"
        }
      }
    ],
    "samples": {
      "pl": {
        "DEVICES": {
          "version": 1,
          "revision": "b8aa06253a550eaf",
          "rows": [
            {
              "path": [
                "LIBRARY"
              ],
              "cells": {
                "TABLET": {
                  "value": true
                }
              }
            },
            {
              "path": [
                "STUDIO"
              ],
              "cells": {
                "CAMERA": {
                  "value": true
                }
              }
            }
          ]
        },
        "CHARGE": {
          "version": 1,
          "revision": "3439516541d77259",
          "rows": [
            {
              "path": [
                "LIBRARY",
                "TABLET"
              ],
              "cells": {
                "BATTERY": {
                  "value": 0
                }
              }
            },
            {
              "path": [
                "STUDIO",
                "CAMERA"
              ],
              "cells": {
                "BATTERY": {
                  "value": 100
                }
              }
            }
          ]
        },
        "PLAN": {
          "version": 1,
          "revision": "6d82a30986433ce1",
          "rows": [
            {
              "path": [
                "LIBRARY",
                "TABLET"
              ],
              "cells": {
                "ACTION": {
                  "value": "Naładuję tablet."
                }
              }
            }
          ]
        }
      },
      "en": {
        "DEVICES": {
          "version": 1,
          "revision": "b8aa06253a550eaf",
          "rows": [
            {
              "path": [
                "LIBRARY"
              ],
              "cells": {
                "TABLET": {
                  "value": true
                }
              }
            },
            {
              "path": [
                "STUDIO"
              ],
              "cells": {
                "CAMERA": {
                  "value": true
                }
              }
            }
          ]
        },
        "CHARGE": {
          "version": 1,
          "revision": "3439516541d77259",
          "rows": [
            {
              "path": [
                "LIBRARY",
                "TABLET"
              ],
              "cells": {
                "BATTERY": {
                  "value": 0
                }
              }
            },
            {
              "path": [
                "STUDIO",
                "CAMERA"
              ],
              "cells": {
                "BATTERY": {
                  "value": 100
                }
              }
            }
          ]
        },
        "PLAN": {
          "version": 1,
          "revision": "6d82a30986433ce1",
          "rows": [
            {
              "path": [
                "LIBRARY",
                "TABLET"
              ],
              "cells": {
                "ACTION": {
                  "value": "I will charge the tablet."
                }
              }
            }
          ]
        }
      }
    }
  }
};
