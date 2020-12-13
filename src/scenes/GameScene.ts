import { Ivan } from 'objects/Ivan/Ivan';
import { HealthBar } from 'objects/HealthBar';
import { SnowManager } from 'objects/SnowManager';
import { Commerade } from 'objects/Turrets/Commerade';
import { CommeradesController } from 'objects/Turrets/CommeradesController';
import { Table } from 'objects/Table';
import { Flag } from 'objects/Flag';
import { TourManager } from 'objects/TourManager';
import { Boris } from 'objects/Turrets/Boris';
import { Inventory } from 'objects/Inventory';
import { EnemyWinController } from 'objects/EnemyWinController';
import { LightsController } from './LightsController';

const PRICES = {
  ammo: 100,
  sasha: 300,
  boris: 500,
  vodka: 2,
  // vodka: 200,
};

export class GameScene extends Phaser.Scene {
  table!: Table;

  bullets!: Phaser.GameObjects.Group;

  inventory!: Inventory;

  public constructor() {
    super({
      key: 'GameScene',
    });
  }

  private ivan!: Ivan;

  private commerades!: Phaser.GameObjects.Group;

  private boris: Boris | undefined;

  private commeradesController!: CommeradesController;

  enemies!: Phaser.GameObjects.Group;

  enemyWinController!: EnemyWinController;

  public create(): void {
    this.bullets = this.add.group();
    const lightsController = new LightsController(this);
    lightsController.startAlarm();

    const bg = this.add.image(1280 / 2, 720 / 2, 'bg').setPipeline('Light2D');
    bg.setScale(5);

    this.physics.world.setBounds(0, 350, 1200, 720 - 350);

    new Flag(this, new Phaser.Math.Vector2(1270 - 250, 720 / 2 - 30));

    new SnowManager(this);
    const keys = this.input.keyboard.createCursorKeys();

    this.inventory = new Inventory();
    this.table = new Table(this, this.inventory);

    this.ivan = new Ivan(
      this,
      new Phaser.Math.Vector2(1270 / 2, 720 / 2),
      keys,
      this.bullets,
      undefined,
      this.inventory
    );

    this.observeTableEvents();
    this.ivan.sprite.setDepth(2);

    this.enemies = this.add.group();

    this.commerades = this.add.group();

    this.commerades.add(
      new Commerade(this, new Phaser.Math.Vector2(1000, 600), this.bullets)
        .sprite
    );

    this.enemyWinController = new EnemyWinController(this, this.enemies);

    const tourManager = new TourManager(this, this.enemies, this.inventory);

    this.enemyWinController.on('enemy-win', () => {
      tourManager.onEnemyFinished();
    });
    tourManager.on('round-start', () => {
      this.table.setRoundOn(true);
      lightsController.startAlarm();
    });
    tourManager.on('round-end', () => {
      this.table.setRoundOn(false);
      lightsController.stopAlarm();
    });

    this.physics.add.collider(
      this.enemies,
      this.bullets,
      (enemyObj, bulletObj) => {
        enemyObj
          .getData('ref')
          .onHit(bulletObj.getData('ref'), tourManager.onEnemyFinished);
        bulletObj.getData('ref').destroy();
      }
    );
    this.boris = new Boris(
      this,
      new Phaser.Math.Vector2(1300, 600),
      this.bullets
    );
    this.boris.activate();

    const healthBar = new HealthBar(this, this.inventory);
    this.inventory.on('change', () => {
      healthBar.onChange();
      this.table.updateVodkaSprite();
    });

    this.physics.add.collider(this.enemies, this.ivan.sprite, () => {
      this.ivan.hit(10);
    });
    this.ivan.on('changeHealth', healthBar.onHealthChange);

    this.commeradesController = new CommeradesController(
      this.commerades,
      this.enemies,
      this.physics
    );
  }

  update() {
    this.ivan.update();
    this.boris?.update();
    this.commerades.children
      .getArray()
      .forEach((obj) => obj.getData('ref').update());
    this.commeradesController.update();

    this.table.setTableEntered(
      Phaser.Geom.Intersects.RectangleToRectangle(
        this.ivan.sprite.getBounds(),
        this.table.box.getBounds()
      )
    );
    this.bullets?.getChildren().forEach((b) => b.getData('ref').update());
    this.enemyWinController.update();
  }

  observeTableEvents = () => {
    this.table.on('drink-vodka', this.handleVodkaDrinked);
    this.table.on('buy-ammo', () => {
      const price = PRICES.ammo;

      if (this.inventory.accountBalance > price) {
        this.inventory.increaseAmmo();
        this.inventory.decreaseAccountBalance(price);
      }
    });
    this.table.on('buy-sasha', () => {
      const price = PRICES.sasha;

      if (this.inventory.accountBalance > price) {
        this.inventory.buySasha();
        this.inventory.decreaseAccountBalance(price);
      }
    });
    this.table.on('buy-boris', () => {
      const price = PRICES.boris;

      if (this.inventory.accountBalance > price) {
        this.inventory.buyBoris();
        this.inventory.decreaseAccountBalance(price);
      }
    });
    this.table.on('buy-vodka', () => {
      const price = PRICES.vodka;

      if (this.inventory.accountBalance > price) {
        this.inventory.buyVodka();
        this.inventory.decreaseAccountBalance(price);
      }
    });
  };

  handleVodkaDrinked = () => {
    if (this.inventory.vodkaCounter > 0) {
      this.ivan.drinkVodka();
      this.inventory.drinkVodka();

      this.cameras.main.startFollow(this.ivan.sprite).setLerp(0.1, 0.1);
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 1500,
        onUpdate: (tween) => {
          this.cameras.main.setRotation(
            Phaser.Math.DegToRad(0 + 5 * tween.getValue())
          );
          this.cameras.main.setZoom(1 + 5 * tween.getValue());
        },
        onComplete: () => {
          this.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 1500,
            onUpdate: (tween) => {
              this.cameras.main.setRotation(
                Phaser.Math.DegToRad(6 - 6 * tween.getValue())
              );
              this.cameras.main.setZoom(6 - 5 * tween.getValue());
            },
            onComplete: () => {
              this.cameras.main.stopFollow();
              this.tweens.addCounter({
                from: 0,
                to: 1,
                duration: 1500,
                onUpdate: () => {
                  this.cameras.main.centerOn(1280 / 2, 720 / 2);
                },
              });
            },
          });
        },
      });
    }
  };
}
