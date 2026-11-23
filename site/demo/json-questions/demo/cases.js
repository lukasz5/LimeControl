// Generated from examples/*.lss and *-expected.csv by generate_cases.py.
window.LimeControlDemoCases = {
  "fieldwork": {
    "title": "Prace terenowe",
    "surveyId": 817301,
    "source": {
      "code": "CITIES",
      "title": "Wybierz lokalizacje",
      "fields": [
        {
          "path": [
            "LODZ"
          ],
          "label": "Łódź",
          "fieldName": "817301X1X100LODZ",
          "value": "Y"
        },
        {
          "path": [
            "GDYNIA"
          ],
          "label": "Gdynia",
          "fieldName": "817301X1X100GDYNIA",
          "value": "Y"
        }
      ]
    },
    "questions": [
      {
        "code": "WORK",
        "title": "Jakie prace wykonano?",
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
        "title": "Ile godzin zajęły prace?",
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
        "title": "Dlaczego prace trwały ponad osiem godzin?",
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
    "sample": {
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
    }
  },
  "equipment": {
    "title": "Gotowość sprzętu do zajęć",
    "surveyId": 817304,
    "source": {
      "code": "PLACES",
      "title": "W których miejscach przygotowujesz sprzęt?",
      "fields": [
        {
          "path": [
            "LIBRARY"
          ],
          "label": "Biblioteka",
          "fieldName": "817304X1X100LIBRARY",
          "value": "Y"
        },
        {
          "path": [
            "STUDIO"
          ],
          "label": "Pracownia",
          "fieldName": "817304X1X100STUDIO",
          "value": "Y"
        }
      ]
    },
    "questions": [
      {
        "code": "DEVICES",
        "title": "Jakie urządzenia sprawdzasz w każdym miejscu?",
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
        "title": "Jaki jest poziom naładowania każdego urządzenia?",
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
        "title": "Zaplanuj działanie dla urządzeń z niskim poziomem baterii.",
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
    "sample": {
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
    }
  }
};
